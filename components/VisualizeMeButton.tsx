"use client";

import { useEffect, useRef, useState } from "react";
import { saveTryOnImage } from "@/app/(site)/tryon-actions";

// Background removal only needs to produce a clean silhouette for a live
// overlay, not full source resolution — feeding it a smaller image cuts
// inference time substantially. The overlay itself is scaled dynamically
// to the detected face anyway, so this costs no visible quality.
const BG_REMOVAL_MAX_DIMENSION = 640;

// Every long-running step below is wrapped in a timeout — a hung worker,
// a stalled CDN fetch, or a WebGPU context that never initializes must
// never leave the customer staring at a frozen screen forever. On timeout
// we fail loudly with a clear "Try again" instead of spinning silently.
const CUTOUT_TIMEOUT_MS = 30_000;
const CAMERA_TIMEOUT_MS = 15_000;
const TRACKER_TIMEOUT_MS = 20_000;

type Status = "idle" | "preparing" | "loading-camera" | "tracking" | "unsupported" | "error";

// Landmark indices from MediaPipe's 478-point face mesh topology — stable
// across the whole Face Landmarker family, used the same way in most
// open-source AR glasses try-on demos.
const EYE_A = 33; // one eye's outer corner
const EYE_B = 263; // the other eye's outer corner
const NOSE_BRIDGE = 6; // top of the nose, between the eyes

// Tuning constants for how the glasses cutout is fit to a detected face.
// These are reasonable starting estimates — glasses generally need to span
// noticeably wider than the bare outer-eye-corner distance to reach the
// temples, but the exact ratio depends on how tightly each product photo
// was cropped. Adjust here after trying it live with a real camera.
const GLASSES_WIDTH_RATIO = 2.25;
const VERTICAL_BLEND = 0.55; // 0 = eye-corner height, 1 = nose-bridge height
const YAW_SKEW_FACTOR = 1.4; // how much the overlay shears when the head turns
const LANDMARK_SMOOTHING = 0.35; // lower = smoother but laggier
const LOST_FACE_FRAMES = 15; // consecutive missed frames before showing the hint

type Point = { x: number; y: number; z: number };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export function VisualizeMeButton({
  productId,
  initialTryonUrl,
  t,
}: {
  productId: string;
  initialTryonUrl: string | null;
  t: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [showNoFaceHint, setShowNoFaceHint] = useState(false);
  const [prepProgress, setPrepProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<import("@mediapipe/tasks-vision").FaceLandmarker | null>(null);
  const glassesImgRef = useRef<HTMLImageElement | null>(null);
  const tryonUrlRef = useRef<string | null>(initialTryonUrl);
  const smoothedRef = useRef<{ a: Point; b: Point; nose: Point } | null>(null);
  const missedFramesRef = useRef(0);
  const cancelledRef = useRef(false);

  // Every cleanup step runs independently — one throwing (e.g. a landmarker
  // already half-closed) must never stop the rest from running, and must
  // never escape as an unhandled error during unmount.
  function stopEverything() {
    cancelledRef.current = true;
    try {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    } catch {}
    rafRef.current = null;
    try {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    } catch {}
    streamRef.current = null;
    try {
      landmarkerRef.current?.close();
    } catch {}
    landmarkerRef.current = null;
    smoothedRef.current = null;
    missedFramesRef.current = 0;
  }

  function close() {
    stopEverything();
    setOpen(false);
    setStatus("idle");
    setShowNoFaceHint(false);
    setPrepProgress(0);
  }

  useEffect(() => stopEverything, []);

  async function downscaleImage(blob: Blob, maxDimension: number): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? blob), "image/png"));
  }

  async function ensureCutoutReady(): Promise<string> {
    if (tryonUrlRef.current) return tryonUrlRef.current;

    setStatus("preparing");
    setPrepProgress(0);
    const sourceRes = await fetch(`/api/tryon-source/${productId}`);
    if (!sourceRes.ok) throw new Error("no-source-photo");
    const sourceBlob = await sourceRes.blob();
    const resizedBlob = await downscaleImage(sourceBlob, BG_REMOVAL_MAX_DIMENSION);

    const { removeBackground } = await import("@imgly/background-removal");
    // CPU + main-thread only: the GPU path and the worker path each add a
    // failure mode that can hang instead of throwing (a WebGPU context
    // that never initializes, a worker script that silently fails to load
    // from the CDN) — CPU on the main thread is slower but predictable,
    // and it's wrapped in a hard timeout below regardless.
    const cutoutBlob = await withTimeout(
      removeBackground(resizedBlob, {
        model: "isnet_quint8",
        device: "cpu",
        proxyToWorker: false,
        progress: (_key, current, total) => {
          if (total > 0) setPrepProgress(Math.round((current / total) * 100));
        },
      }),
      CUTOUT_TIMEOUT_MS
    );

    const formData = new FormData();
    formData.append("image", cutoutBlob, "tryon.png");
    const url = await withTimeout(saveTryOnImage(productId, formData), 15_000);
    tryonUrlRef.current = url;
    return url;
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image-load-failed"));
      img.src = src;
    });
  }

  async function start() {
    cancelledRef.current = false;
    setOpen(true);
    setStatus("preparing");
    setPrepProgress(0);
    setShowNoFaceHint(false);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    try {
      const cutoutUrl = await ensureCutoutReady();
      if (cancelledRef.current) return;
      glassesImgRef.current = await loadImage(cutoutUrl);
      if (cancelledRef.current) return;

      setStatus("loading-camera");
      const stream = await withTimeout(
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        }),
        CAMERA_TIMEOUT_MS
      );
      if (cancelledRef.current) {
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("no-video-element");
      video.srcObject = stream;
      await video.play();
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) resolve();
        else video.onloadedmetadata = () => resolve();
      });
      if (cancelledRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("no-canvas-element");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-canvas-context");

      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await withTimeout(
        FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"),
        TRACKER_TIMEOUT_MS
      );
      // CPU delegate only, same reasoning as background removal above —
      // predictable over marginally faster.
      const landmarker = await withTimeout(
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        }),
        TRACKER_TIMEOUT_MS
      );
      if (cancelledRef.current) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;

      setStatus("tracking");
      const loop = () => {
        // A runtime error here would otherwise escape into a bare
        // requestAnimationFrame callback, outside any try/catch — exactly
        // the kind of uncaught exception that trips Next's global error
        // boundary and takes the whole page down with it.
        try {
          if (cancelledRef.current || !landmarkerRef.current) return;
          const result = landmarkerRef.current.detectForVideo(video, performance.now());
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const landmarks = result.faceLandmarks?.[0];
          if (landmarks && glassesImgRef.current) {
            missedFramesRef.current = 0;
            setShowNoFaceHint(false);
            drawGlasses(ctx, landmarks, glassesImgRef.current, canvas.width, canvas.height, smoothedRef);
          } else {
            missedFramesRef.current += 1;
            if (missedFramesRef.current > LOST_FACE_FRAMES) setShowNoFaceHint(true);
          }

          rafRef.current = requestAnimationFrame(loop);
        } catch (err) {
          console.error("Visualize me tracking loop failed:", err);
          stopEverything();
          setStatus("error");
        }
      };
      loop();
    } catch (err) {
      console.error("Visualize me failed:", err);
      stopEverything();
      if (!cancelledRef.current) setStatus("error");
    }
  }

  const errorMessage =
    status === "unsupported"
      ? t["product.visualizeUnsupported"]
      : t["product.visualizeCameraError"];

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="mt-3 flex w-full items-center justify-center gap-2 bg-brand-black py-3 text-center text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
          <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {t["product.visualizeMe"]}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={close}
            aria-label={t["product.visualizeClose"]}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
          >
            ×
          </button>

          {(status === "preparing" || status === "loading-camera" || status === "tracking") && (
            <div
              className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-md bg-neutral-900"
              style={{ transform: "scaleX(-1)" }}
            >
              <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          )}

          <div className="absolute bottom-10 left-0 right-0 px-8 text-center text-sm text-white">
            {status === "preparing" && (
              <div>
                <div className="mx-auto flex h-8 w-8 items-center justify-center">
                  <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
                <p className="mt-2">
                  {t["product.visualizePreparing"]}
                  {prepProgress > 0 ? ` ${prepProgress}%` : ""}
                </p>
              </div>
            )}
            {status === "loading-camera" && <p>{t["product.visualizeLoading"]}</p>}
            {(status === "unsupported" || status === "error") && (
              <div>
                <p className="text-red-400">{errorMessage}</p>
                <button
                  type="button"
                  onClick={start}
                  className="mt-3 border border-white px-4 py-1.5 text-xs uppercase tracking-wide hover:bg-white hover:text-brand-black"
                >
                  {t["product.visualizeMe"]}
                </button>
              </div>
            )}
            {status === "tracking" && showNoFaceHint && <p>{t["product.visualizeNoFace"]}</p>}
          </div>
        </div>
      )}
    </>
  );
}

function drawGlasses(
  ctx: CanvasRenderingContext2D,
  landmarks: Point[],
  glassesImg: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  smoothedRef: React.MutableRefObject<{ a: Point; b: Point; nose: Point } | null>
) {
  const rawA = landmarks[EYE_A];
  const rawB = landmarks[EYE_B];
  const rawNose = landmarks[NOSE_BRIDGE];
  if (!rawA || !rawB || !rawNose) return;

  // Frame-to-frame landmark jitter reads as a shaky overlay — smoothing the
  // three points we actually use keeps it steady without adding much lag.
  if (!smoothedRef.current) {
    smoothedRef.current = { a: { ...rawA }, b: { ...rawB }, nose: { ...rawNose } };
  } else {
    const s = smoothedRef.current;
    const lerp = (from: Point, to: Point) => ({
      x: from.x + (to.x - from.x) * LANDMARK_SMOOTHING,
      y: from.y + (to.y - from.y) * LANDMARK_SMOOTHING,
      z: from.z + (to.z - from.z) * LANDMARK_SMOOTHING,
    });
    s.a = lerp(s.a, rawA);
    s.b = lerp(s.b, rawB);
    s.nose = lerp(s.nose, rawNose);
  }
  const { a, b, nose } = smoothedRef.current;

  const ax = a.x * canvasWidth,
    ay = a.y * canvasHeight;
  const bx = b.x * canvasWidth,
    by = b.y * canvasHeight;
  const noseY = nose.y * canvasHeight;

  const eyeDist = Math.hypot(bx - ax, by - ay);
  const angle = Math.atan2(by - ay, bx - ax);

  const glassesWidth = eyeDist * GLASSES_WIDTH_RATIO;
  const glassesHeight = glassesWidth * (glassesImg.height / glassesImg.width);

  const centerX = (ax + bx) / 2;
  const eyeLineY = (ay + by) / 2;
  const centerY = eyeLineY + (noseY - eyeLineY) * VERTICAL_BLEND;

  // Rough yaw estimate from the depth difference between the two eye
  // corners — shears the overlay a little when the head turns, instead of
  // it staying perfectly flat like a sticker.
  const yawSkew = (b.z - a.z) * YAW_SKEW_FACTOR;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.transform(1, 0, yawSkew, 1, 0, 0);
  ctx.drawImage(glassesImg, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);
  ctx.restore();
}
