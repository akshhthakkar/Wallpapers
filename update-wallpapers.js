/**
 * Wallpaper Automation & Build Script
 *
 * Functions:
 * 1. Optimizes images (Resize to 1920x1080 + Convert to WebP) using Sharp
 * 2. Generates wallpapers.json
 * 3. Generates sitemap.xml
 *
 * Usage:
 * - Runs automatically on Vercel deployment ("build" script)
 * - Can be run locally: node update-wallpapers.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
sharp.cache(false); // Disable cache to prevent memory issues with large files

// Configuration
const SITE_URL = "https://wallpaperverse.akshthakkar.me";
const INPUT_DIR = path.join(__dirname, "wallpapers");
const OUTPUT_DIR = path.join(__dirname, "optimized");
const THUMB_DIR = path.join(__dirname, "thumbnails");
const JSON_FILE = path.join(__dirname, "wallpapers.json");
const SITEMAP_FILE = path.join(__dirname, "sitemap.xml");

// Supported extensions
const IMG_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR);

// Generate ID from filename
function generateId(filename) {
  return filename
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

// Generate Title from filename
function generateTitle(filename) {
  let name = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "");

  // Remove common prefixes
  const prefixes = [
    "demon-slayer-",
    "jujutsu-kaisen-",
    "marvel-",
    "movie-",
    "tv-show-",
    "disney-",
    "sneaker-",
  ];
  for (const p of prefixes) {
    if (name.toLowerCase().startsWith(p)) {
      name = name.slice(p.length);
      break;
    }
  }

  // Convert "tanjiro-kamado" -> "Tanjiro Kamado"
  return name
    .replace(/[-_]+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Optimize Single Image (creates both optimized and thumbnail versions)
async function processImage(category, filename) {
  const inputPath = path.join(INPUT_DIR, category, filename);
  const outputCategoryDir = path.join(OUTPUT_DIR, category);
  const thumbCategoryDir = path.join(THUMB_DIR, category);

  if (!fs.existsSync(outputCategoryDir)) fs.mkdirSync(outputCategoryDir);
  if (!fs.existsSync(thumbCategoryDir)) fs.mkdirSync(thumbCategoryDir);

  // Output is always WebP for performance
  const outputFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, ".webp");
  const outputPath = path.join(outputCategoryDir, outputFilename);
  const thumbPath = path.join(thumbCategoryDir, outputFilename);

  console.log(`⚙️ Optimizing: ${category}/${filename}...`);

  try {
    // Portrait Logic: Smart "Pillarbox" with blurred background
    // This makes sure portrait images fill the 1920x1080 landscape frame elegantly
    if (metadata.width < metadata.height) {
      // 1. Create blurred background (fills 1920x1080)
      const background = await sharp(inputPath)
        .rotate()
        .resize(1920, 1080, { fit: "cover" })
        .blur(50) // Strong blur
        .modulate({ brightness: 0.6 }) // Darken background for contrast
        .toBuffer();

      // 2. Create foreground (fit inside 1080 height)
      const foreground = await sharp(inputPath)
        .rotate()
        .resize({
          width: 1920,
          height: 1080,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      // 3. Composite for Optimized
      if (!fs.existsSync(outputPath)) {
        await sharp(background)
          .composite([{ input: foreground }])
          .webp({ quality: 85 })
          .toFile(outputPath);
      }

      // 4. Same logic for Thumbnail (400x225)
      if (!fs.existsSync(thumbPath)) {
        const thumbBg = await sharp(inputPath)
          .rotate()
          .resize(400, 225, { fit: "cover" })
          .blur(20)
          .modulate({ brightness: 0.6 })
          .toBuffer();

        const thumbFg = await sharp(inputPath)
          .rotate()
          .resize({
            width: 400,
            height: 225,
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer();

        await sharp(thumbBg)
          .composite([{ input: thumbFg }])
          .webp({ quality: 70 })
          .toFile(thumbPath);
      }
    }
    // Landscape Logic: Standard Cover
    else {
      // Create optimized version (1920x1080) if not exists
      if (!fs.existsSync(outputPath)) {
        await sharp(inputPath)
          .rotate() // Only auto-rotate from EXIF
          .resize({
            width: 1920,
            height: 1080,
            fit: "cover", // fills the screen
            position: "center",
          })
          .webp({ quality: 85 })
          .toFile(outputPath);
      }

      // Create thumbnail version (400x225) if not exists
      if (!fs.existsSync(thumbPath)) {
        await sharp(inputPath)
          .rotate() // Only auto-rotate from EXIF
          .resize({
            width: 400,
            height: 225,
            fit: "cover",
            position: "center",
          })
          .webp({ quality: 70 })
          .toFile(thumbPath);
      }
    }

    return {
      success: true,
      optimizedPath: `optimized/${category}/${outputFilename}`,
      thumbnailPath: `thumbnails/${category}/${outputFilename}`,
    };
  } catch (error) {
    console.warn(
      `⚠️ Complex optimization failed for ${filename}: ${error.message}`
    );
    console.log(`🔄 Attempting simple fallback for ${filename}...`);

    try {
      // Fallback: Simple resize without composite (less memory intensive)
      await sharp(inputPath)
        .rotate()
        .resize(1920, 1080, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      await sharp(inputPath)
        .rotate()
        .resize(400, 225, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .webp({ quality: 60 })
        .toFile(thumbPath);

      return {
        success: true,
        optimizedPath: `optimized/${category}/${outputFilename}`,
        thumbnailPath: `thumbnails/${category}/${outputFilename}`,
      };
    } catch (fallbackError) {
      console.error(`❌ CRITICAL FAIL for ${filename}:`, fallbackError.message);
      // Final Fallback to original
      return {
        success: true,
        optimizedPath: `wallpapers/${category}/${filename}`,
        thumbnailPath: `wallpapers/${category}/${filename}`,
      };
    }
  }
}

// Generate Sitemap
function generateSitemap(wallpapers) {
  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/submit</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/collection.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

  Object.values(wallpapers)
    .flat()
    .forEach((item) => {
      const id = generateId(item.file);
      xml += `  <url>
    <loc>${SITE_URL}/wallpaper?id=${id}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
  </url>\n`;
    });

  xml += "</urlset>\n";
  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log("✅ sitemap.xml generated");
}

// Main Build Function
async function build() {
  console.log("🚀 Starting Build Process...");

  if (!fs.existsSync(INPUT_DIR)) {
    console.error("❌ wallpapers directory not found!");
    process.exit(1);
  }

  const categories = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => fs.statSync(path.join(INPUT_DIR, f)).isDirectory());

  const wallpapers = {};
  let count = 0;

  for (const category of categories) {
    const catFiles = fs
      .readdirSync(path.join(INPUT_DIR, category))
      .filter((f) => IMG_EXTS.includes(path.extname(f).toLowerCase()));

    if (catFiles.length === 0) continue;

    wallpapers[category] = [];

    for (const file of catFiles) {
      const result = await processImage(category, file);

      if (result.success) {
        wallpapers[category].push({
          file: file,
          title: generateTitle(file),
          thumbnail: result.thumbnailPath,
          optimized: result.optimizedPath,
          original: `wallpapers/${category}/${file}`,
        });
        count++;
      }
    }
  }

  // Save JSON
  fs.writeFileSync(JSON_FILE, JSON.stringify(wallpapers, null, 2));
  console.log(`✅ wallpapers.json generated (${count} wallpapers)`);

  // Save Sitemap
  generateSitemap(wallpapers);

  console.log("\n✨ Build Complete!");
}

build();
