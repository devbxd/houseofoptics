// Scrape all public posts for a given Instagram account via the imginn.com
// read-only mirror (Instagram itself blocks unauthenticated automated
// requests). Downloads the highest-resolution image available for every
// post and writes scripts/scraped/manifest.json describing each post.
//
// Usage: node scripts/scrape-instagram.mjs <instagram_username>

import fs from "node:fs/promises";
import path from "node:path";

const USERNAME = process.argv[2] || "house.of.optics";
const OUT_DIR = path.join(process.cwd(), "scripts", "scraped");
const IMAGES_DIR = path.join(OUT_DIR, "images");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
  Referer: `https://imginn.com/${USERNAME}/`,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchProfileId(username) {
  const res = await fetch(`https://imginn.com/${username}/`, {
    headers: { "User-Agent": HEADERS["User-Agent"] },
  });
  const html = await res.text();
  const match = html.match(/data-id="(\d+)"[^>]*data-type="(?:default|)"/) ||
    html.match(/data-cursor="[^"]*"\s+data-id="(\d+)"/);
  const idMatch = html.match(/data-id="(\d+)"/);
  if (!idMatch) throw new Error("Could not find profile id on imginn page — profile may not exist or mirror layout changed");
  return idMatch[1];
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": HEADERS["User-Agent"] } });
  if (!res.ok) throw new Error(`Image download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
  return buf.length;
}

function slugifyCode(code) {
  return code.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function main() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  console.log(`Resolving imginn profile id for @${USERNAME}...`);
  const profileId = await fetchProfileId(USERNAME);
  console.log(`Profile id: ${profileId}`);

  const manifest = [];
  let cursor = "";
  let page = 0;
  const MAX_PAGES = 300; // safety cap (~3600 posts)

  while (page < MAX_PAGES) {
    page += 1;
    const url = `https://imginn.com/api/posts/?id=${profileId}&cursor=${encodeURIComponent(
      cursor
    )}&username=${USERNAME}&verified=0&hl=en`;
    console.log(`Fetching page ${page} (cursor=${cursor || "<start>"})...`);
    const data = await fetchJson(url);

    if (data.code !== 200 || !Array.isArray(data.items)) {
      console.log("Unexpected response, stopping:", JSON.stringify(data).slice(0, 300));
      break;
    }

    for (const item of data.items) {
      if (item.isVideo) {
        console.log(`Skipping video/reel post ${item.code}`);
        continue;
      }

      const postDir = path.join(IMAGES_DIR, slugifyCode(item.code));
      await fs.mkdir(postDir, { recursive: true });

      const sources = Array.isArray(item.srcs) && item.srcs.length > 0 ? item.srcs : [item.src];
      const images = [];
      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];
        if (!src) continue;
        const destPath = path.join(postDir, `${i + 1}.jpg`);
        try {
          const bytes = await downloadImage(src, destPath);
          images.push({ file: path.relative(OUT_DIR, destPath).replace(/\\/g, "/"), bytes });
          console.log(`  downloaded ${item.code}/${i + 1}.jpg (${bytes} bytes)`);
        } catch (err) {
          console.log(`  failed to download image ${i + 1} for ${item.code}: ${err.message}`);
        }
        await sleep(150);
      }

      manifest.push({
        code: item.code,
        caption: item.alt || "",
        date: item.date || item.time || null,
        isSidecar: !!item.isSidecar,
        likeCount: item.likeCount ?? null,
        images,
      });
    }

    if (!data.hasNext || !data.cursor) {
      console.log("No more pages.");
      break;
    }
    cursor = data.cursor;
    await sleep(400);
  }

  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify({ username: USERNAME, scrapedAt: new Date().toISOString(), posts: manifest }, null, 2)
  );

  console.log(`\nDone. ${manifest.length} posts saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
