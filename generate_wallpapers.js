const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = "./wallpapers";
const outputDir = "./optimized";
const jsonFile = "wallpapers.json";

// Ensure root output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const optimizeImage = async (category, file) => {
  try {
    const categoryInputDir = path.join(inputDir, category);
    const categoryOutputDir = path.join(outputDir, category);

    // Create output category dir if missing
    if (!fs.existsSync(categoryOutputDir)) {
      fs.mkdirSync(categoryOutputDir);
    }

    const inputPath = path.join(categoryInputDir, file);
    const outputPath = path.join(categoryOutputDir, file);

    // Skip if it's not an image
    if (
      ![".jpg", ".jpeg", ".png", ".webp"].includes(
        path.extname(file).toLowerCase()
      )
    ) {
      return false;
    }

    // Step 1: Auto-orient based on EXIF to match what user sees in Explorer
    // We render to buffer to bake this rotation in before checking dimensions
    const buffer = await sharp(inputPath).rotate().toBuffer();

    // Step 2: Load the normalized image
    let image = sharp(buffer);
    const metadata = await image.metadata();

    // Step 3: Check dimensions of the normalized image
    // If it is Portrait (Height > Width), rotate it 90 degrees to make it Landscape
    if (metadata.width < metadata.height) {
      // Apply 90 deg rotation
      image = image.rotate(90);
    }

    // Step 4: Resize to standard landscape resolution
    // 'cover' ensures the image fills the 1920x1080 frame completely
    await image
      .resize({
        width: 1920,
        height: 1080,
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
    return false;
  }
};

const getTitle = (filename) => {
  let name = filename.replace(/\.(jpg|jpeg|png|webp)$/i, ""); // remove extension
  name = name.replace(/-wallpaper$/i, ""); // remove -wallpaper suffix

  // Remove known prefixes (legacy support, still good to clean up titles)
  const prefixes = [
    "demon-slayer-",
    "jujutsu-kaisen-",
    "marvel-",
    "movie-",
    "tv-show-",
    "disney-",
    "sneaker-",
  ];

  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      name = name.substring(prefix.length);
      break;
    }
  }

  // Replace dashes with spaces and Title Case
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const main = async () => {
  console.log(
    "Starting wallpaper generation process (+ Auto-Orient & Rotate)..."
  );

  try {
    if (!fs.existsSync(inputDir)) {
      console.error("Input directory 'wallpapers' not found!");
      return;
    }

    const categories = fs
      .readdirSync(inputDir)
      .filter((f) => fs.statSync(path.join(inputDir, f)).isDirectory());

    const wallpapers = {};

    for (const category of categories) {
      wallpapers[category] = [];
      const files = fs.readdirSync(path.join(inputDir, category));

      for (const file of files) {
        const isImage = await optimizeImage(category, file);
        if (isImage) {
          const title = getTitle(file);

          wallpapers[category].push({
            file: file,
            title: title,
            optimized: `./optimized/${category}/${file}`,
            original: `./wallpapers/${category}/${file}`,
          });
        }
      }
    }

    console.log("Writing wallpapers.json...");
    fs.writeFileSync(jsonFile, JSON.stringify(wallpapers, null, 2));
    console.log("Done! wallpapers.json updated.");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
};

main();
