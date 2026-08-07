import sharp from "sharp";

const SRC = "public/logo.png";
const OUT = "public/logo-full.png";

// Keep the full lockup (house icon + "S / E" + "HOUSE OF OPTICS" wordmark)
// as sent, just crop the empty smoke margins and turn the black background
// transparent: use luminance as the alpha channel (bright white line art ->
// opaque, dark smoke -> transparent).
const CROP = { left: 330, top: 165, width: 660, height: 810 };

async function main() {
  const cropped = sharp(SRC).extract(CROP);

  const luminance = await cropped
    .clone()
    .grayscale()
    .linear(2.2, -180)
    .toBuffer();

  const { width, height } = await sharp(luminance).metadata();

  const white = await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toBuffer();

  await sharp(white).joinChannel(luminance).png().toFile(OUT);

  console.log(`Wrote ${OUT} (${width}x${height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
