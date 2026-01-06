const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = "./";
const outputDir = "./optimized";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const optimizeImage = async (file) => {
  try {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    // Skip if it's not an image or if it's the script itself or node_modules
    if (
      ![".jpg", ".jpeg", ".png", ".webp"].includes(
        path.extname(file).toLowerCase()
      )
    ) {
      return;
    }

    console.log(`Optimizing ${file}...`);

    await sharp(inputPath)
      .resize({ width: 1920, withoutEnlargement: true }) // Max width Full HD
      .jpeg({ quality: 80, mozjpeg: true }) // Good compression
      .toFile(outputPath);

    console.log(`Saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
};

fs.readdir(inputDir, (err, files) => {
  if (err) {
    return console.error("Unable to scan directory: " + err);
  }
  files.forEach((file) => {
    optimizeImage(file);
  });
});
