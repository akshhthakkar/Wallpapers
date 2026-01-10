// Wallpaper Page JavaScript
// Handles dynamic loading of wallpaper data, SEO meta updates, and related wallpapers

let allWallpapers = [];
let currentWallpaper = null;
let currentCategory = null;

// Category display names
const categoryNames = {
  anime: "Anime",
  marvel: "Marvel",
  movies: "Movies & TV Shows",
  cars: "Cars & Supercars",
  transformers: "Transformers",
  random: "Random",
};

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await loadWallpaperData();
  const wallpaperId = getWallpaperIdFromUrl();

  console.log("Wallpaper ID from URL:", wallpaperId);
  console.log("Total wallpapers loaded:", allWallpapers.length);

  if (wallpaperId) {
    displayWallpaper(wallpaperId);
  } else {
    showError("Wallpaper not found");
  }

  initBackToTop();
});

// Get wallpaper ID from URL
function getWallpaperIdFromUrl() {
  // Support both /wallpaper/id and /wallpaper?id=xxx formats
  const urlParams = new URLSearchParams(window.location.search);
  const queryId = urlParams.get("id");

  if (queryId) return queryId;

  // Extract from path: /wallpaper/tanjiro-kamado
  const pathParts = window.location.pathname.split("/");
  const wallpaperIndex = pathParts.indexOf("wallpaper");

  if (wallpaperIndex !== -1 && pathParts[wallpaperIndex + 1]) {
    return pathParts[wallpaperIndex + 1];
  }

  return null;
}

// Load wallpaper data from JSON
async function loadWallpaperData() {
  try {
    // Use absolute path to ensure it works from any page
    const response = await fetch("/wallpapers.json?v=" + Date.now());
    const data = await response.json();

    // Flatten all wallpapers with category info
    allWallpapers = [];
    for (const [category, items] of Object.entries(data)) {
      items.forEach((item) => {
        // Generate ID from filename
        const id = generateIdFromFile(item.file);
        allWallpapers.push({
          ...item,
          id,
          category,
        });
      });
    }
    console.log(
      "Wallpapers loaded:",
      allWallpapers.map((w) => w.id)
    );
  } catch (error) {
    console.error("Failed to load wallpapers:", error);
  }
}

// Generate URL-friendly ID from filename
function generateIdFromFile(filename) {
  return filename
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

// Display wallpaper
function displayWallpaper(wallpaperId) {
  console.log("Looking for wallpaper with ID:", wallpaperId);

  // Find wallpaper by exact ID match
  currentWallpaper = allWallpapers.find((w) => w.id === wallpaperId);

  if (!currentWallpaper) {
    // Try partial match (handles slight variations)
    currentWallpaper = allWallpapers.find(
      (w) => w.id.includes(wallpaperId) || wallpaperId.includes(w.id)
    );
  }

  if (!currentWallpaper) {
    // Try matching without file extension suffix in URL
    currentWallpaper = allWallpapers.find((w) => {
      const normalizedId = wallpaperId.replace(/-wallpaper$/, "");
      const normalizedWId = w.id.replace(/-wallpaper$/, "");
      return (
        normalizedId === normalizedWId ||
        w.id.startsWith(wallpaperId) ||
        wallpaperId.startsWith(w.id)
      );
    });
  }

  console.log("Found wallpaper:", currentWallpaper);

  if (!currentWallpaper) {
    showError("Wallpaper not found");
    return;
  }

  currentCategory = currentWallpaper.category;

  // Update image
  const img = document.getElementById("wallpaperImage");
  const spinner = document.getElementById("loadingSpinner");

  img.onload = () => {
    img.classList.add("loaded");
    spinner.classList.add("hidden");
  };

  img.src = currentWallpaper.optimized + "?v=" + Date.now();
  img.alt = `${currentWallpaper.title} - ${categoryNames[currentCategory]} HD Wallpaper | WallpaperVerse`;

  // Update title and info
  document.getElementById("wallpaperTitle").textContent =
    currentWallpaper.title;
  document.getElementById("categoryBadge").textContent =
    categoryNames[currentCategory].toUpperCase();
  document.getElementById(
    "wallpaperDescription"
  ).textContent = `Download this ${categoryNames[currentCategory]} wallpaper in HD quality. Free for personal use on desktop and mobile.`;

  // Update breadcrumb
  document.getElementById("breadcrumb-category").textContent =
    categoryNames[currentCategory];
  document.getElementById("breadcrumb-title").textContent =
    currentWallpaper.title;

  // Update SEO meta tags
  updateMetaTags();

  // Load related wallpapers
  loadRelatedWallpapers();

  // Track page view and load stats
  trackView(currentWallpaper.id);
  loadStats(currentWallpaper.id);
}

// ========== ANALYTICS FUNCTIONS ==========

// Track page view
async function trackView(wallpaperId) {
  if (!window.supabaseClient) {
    console.warn("Supabase not ready, skipping view tracking");
    return;
  }

  try {
    // Check if record exists - use maybeSingle to avoid error when no row exists
    const { data: existing } = await window.supabaseClient
      .from("wallpaper_stats")
      .select("views")
      .eq("id", wallpaperId)
      .maybeSingle();

    if (existing) {
      // Increment views
      await window.supabaseClient
        .from("wallpaper_stats")
        .update({ views: existing.views + 1 })
        .eq("id", wallpaperId);
    } else {
      // Create new record
      await window.supabaseClient
        .from("wallpaper_stats")
        .insert({ id: wallpaperId, views: 1, downloads: 0 });
    }
    console.log("👁 View tracked for:", wallpaperId);
  } catch (error) {
    console.error("Failed to track view:", error);
  }
}

// Track download
async function trackDownload(wallpaperId) {
  if (!window.supabaseClient) {
    console.warn("Supabase not ready, skipping download tracking");
    return;
  }

  try {
    // Check if record exists - use maybeSingle to avoid error when no row exists
    const { data: existing } = await window.supabaseClient
      .from("wallpaper_stats")
      .select("downloads")
      .eq("id", wallpaperId)
      .maybeSingle();

    if (existing) {
      // Increment downloads
      await window.supabaseClient
        .from("wallpaper_stats")
        .update({ downloads: existing.downloads + 1 })
        .eq("id", wallpaperId);
    } else {
      // Create new record
      await window.supabaseClient
        .from("wallpaper_stats")
        .insert({ id: wallpaperId, views: 0, downloads: 1 });
    }
    console.log("⬇ Download tracked for:", wallpaperId);
  } catch (error) {
    console.error("Failed to track download:", error);
  }
}

// Load and display stats
async function loadStats(wallpaperId) {
  const statsBadge = document.getElementById("statsBadge");
  if (!statsBadge) return;

  if (!window.supabaseClient) {
    // Retry after Supabase loads
    setTimeout(() => loadStats(wallpaperId), 1000);
    return;
  }

  try {
    const { data } = await window.supabaseClient
      .from("wallpaper_stats")
      .select("views, downloads")
      .eq("id", wallpaperId)
      .single();

    if (data) {
      statsBadge.textContent = `👁 ${formatNumber(
        data.views
      )} • ⬇ ${formatNumber(data.downloads)}`;
    }
  } catch (error) {
    console.log("No stats yet for this wallpaper");
  }
}

// Format numbers (1000 -> 1K, etc.)
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Update meta tags for SEO
function updateMetaTags() {
  const title = `${currentWallpaper.title} - ${categoryNames[currentCategory]} Wallpaper | WallpaperVerse`;
  const description = `Download ${currentWallpaper.title} wallpaper in HD quality. Free ${categoryNames[currentCategory]} wallpaper for desktop and mobile from WallpaperVerse.`;
  const imageUrl = `https://wallpaperverse.akshthakkar.me/${currentWallpaper.original}`;
  const pageUrl = `https://wallpaperverse.akshthakkar.me/wallpaper/${currentWallpaper.id}`;

  // Update document title
  document.title = title;

  // Update meta tags
  updateMeta("description", description);
  updateMeta(
    "keywords",
    `${currentWallpaper.title} wallpaper, ${categoryNames[currentCategory]} wallpaper, hd wallpaper, 4k wallpaper, free download, desktop background`
  );

  // Update canonical
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = pageUrl;

  // Update Open Graph
  updateMetaProperty("og:title", title);
  updateMetaProperty("og:description", description);
  updateMetaProperty("og:url", pageUrl);
  updateMetaProperty("og:image", imageUrl);

  // Update Twitter
  updateMeta("twitter:title", title);
  updateMeta("twitter:description", description);
  updateMeta("twitter:image", imageUrl);

  // Update ImageObject schema
  const imageSchema = document.getElementById("imageSchema");
  if (imageSchema) {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      name: currentWallpaper.title,
      description: description,
      contentUrl: imageUrl,
      thumbnailUrl: `https://wallpaperverse.akshthakkar.me/${currentWallpaper.optimized}`,
      author: {
        "@type": "Person",
        name: "Aksh Thakkar",
      },
      copyrightNotice: "Free for personal use",
      license: "https://creativecommons.org/licenses/by-nc/4.0/",
    };
    imageSchema.textContent = JSON.stringify(schemaData, null, 2);
  }

  // Update breadcrumb schema
  const breadcrumbSchema = document.getElementById("breadcrumbSchema");
  if (breadcrumbSchema) {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://wallpaperverse.akshthakkar.me/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: categoryNames[currentCategory],
          item: `https://wallpaperverse.akshthakkar.me/#collections`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: currentWallpaper.title,
          item: pageUrl,
        },
      ],
    };
    breadcrumbSchema.textContent = JSON.stringify(schemaData, null, 2);
  }
}

// Helper to update meta name tags
function updateMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (meta) {
    meta.content = content;
  }
}

// Helper to update meta property tags
function updateMetaProperty(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (meta) {
    meta.content = content;
  }
}

// Load related wallpapers from same category
function loadRelatedWallpapers() {
  const relatedGrid = document.getElementById("relatedGrid");
  if (!relatedGrid) return;

  // Get wallpapers from same category, excluding current
  const related = allWallpapers
    .filter(
      (w) => w.category === currentCategory && w.id !== currentWallpaper.id
    )
    .slice(0, 6);

  // If not enough, add from other categories
  if (related.length < 6) {
    const others = allWallpapers
      .filter((w) => w.id !== currentWallpaper.id && !related.includes(w))
      .slice(0, 6 - related.length);
    related.push(...others);
  }

  relatedGrid.innerHTML = related
    .map(
      (w) => `
    <a href="/wallpaper/${w.id}" class="related-item">
      <img src="${w.optimized}" alt="${w.title} - ${
        categoryNames[w.category]
      } Wallpaper" loading="lazy" />
      <div class="overlay">
        <span>${w.title}</span>
      </div>
    </a>
  `
    )
    .join("");
}

// Download wallpaper
function downloadWallpaper() {
  if (!currentWallpaper) return;

  // Track download
  trackDownload(currentWallpaper.id);

  const link = document.createElement("a");
  link.href = currentWallpaper.original;
  link.download = `${currentWallpaper.title.replace(
    /\s+/g,
    "-"
  )}-wallpaper.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Share wallpaper
async function shareWallpaper() {
  if (!currentWallpaper) return;

  const shareData = {
    title: `${currentWallpaper.title} - WallpaperVerse`,
    text: `Check out this amazing ${categoryNames[currentCategory]} wallpaper!`,
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled or error
      copyToClipboard(window.location.href);
    }
  } else {
    copyToClipboard(window.location.href);
  }
}

// Copy to clipboard fallback
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification("Link copied to clipboard!");
    })
    .catch(() => {
      // Fallback
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showNotification("Link copied to clipboard!");
    });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-secondary);
    color: var(--color-bg);
    padding: 1rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    z-index: 1000;
    animation: slideUp 0.3s ease;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Show error
function showError(message) {
  document.getElementById("wallpaperTitle").textContent = "Wallpaper Not Found";
  document.getElementById("wallpaperDescription").textContent =
    "The wallpaper you're looking for doesn't exist. Browse our collections to find amazing wallpapers!";
  document.getElementById("loadingSpinner").classList.add("hidden");
}

// Back to top button
function initBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Mobile menu toggle
function toggleMenu() {
  const nav = document.getElementById("mainNav");
  const navRight = nav.querySelector(".nav-right");
  navRight.classList.toggle("active");
}

console.log("⚡ WALLPAPERVERSE - Individual Page ⚡");
