// REGISTER GSAP PLUGINS
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// NAVIGATION SCROLL
const nav = document.getElementById("mainNav");
window.addEventListener("scroll", () => {
  if (window.pageYOffset > 100) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});

// HERO ANIMATIONS
const heroTimeline = gsap.timeline();

if (document.querySelector(".hero-title")) {
  heroTimeline
    .from(".hero-badge", {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    })
    .from(
      ".title-line",
      {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: "power4.out",
      },
      "-=0.5"
    )
    .from(
      ".hero-subtitle",
      {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.5"
    );
}
/* Animations removed to force visibility
  .from(
    ".stat-card",
    {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "back.out(1.7)",
    },
    "-=0.4"
  )
  .from(
    ".btn-hero",
    {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    },
    "-=0.6"
  );
  */

// DYNAMIC STATS
function updateStats() {
  const wallpaperCount = document.querySelectorAll(".grid-item").length;
  const collectionCount = document.querySelectorAll(".collection-card").length;

  const statWallpapers = document.getElementById("stat-wallpapers");
  const statCollections = document.getElementById("stat-collections");

  if (statWallpapers) statWallpapers.textContent = wallpaperCount + "+";
  if (statCollections) statCollections.textContent = collectionCount;
}

// Run stats update
updateStats();

// COLLECTION ANIMATIONS
gsap.utils.toArray(".collection-card").forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
    y: 100,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });
});

// ABOUT SECTION ANIMATION
if (document.querySelector(".about-content")) {
  gsap.from(".about-content", {
    scrollTrigger: {
      trigger: ".about-content",
      start: "top 75%",
      toggleActions: "play none none reverse",
    },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });
}

// SMOOTH SCROLLING
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#" && href !== "") {
      e.preventDefault();
      gsap.to(window, {
        duration: 0.6,
        scrollTo: { y: href, offsetY: 80 },
        ease: "power2.inOut",
      });
    }
  });
});

// BACK TO TOP
const backToTopBtn = document.getElementById("backToTop");
if (backToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 500) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    gsap.to(window, { duration: 0.6, scrollTo: 0, ease: "power2.inOut" });
  });
}

// IMAGE PRELOADING (Performance)
// Preload a few random images from the first loaded category
function preloadImages(data) {
  const categories = Object.keys(data);
  if (categories.length === 0) return;

  // Pick first category or random one
  const firstCategory = categories[0];
  const items = data[firstCategory];

  // Preload up to 3 optimized images for display
  const imagesToPreload = items.slice(0, 3).map((item) => item.optimized);

  imagesToPreload.forEach((src) => {
    const img = new Image();
    img.src = src + "?v=" + Date.now();
  });
}
// window.addEventListener("load", preloadImages); // Removed: Called dynamically now

// AUTO-SCROLL COLLECTIONS (Optimized)
// AUTO-SCROLL COLLECTIONS (Optimized)
function initAutoScroll() {
  document.querySelectorAll(".collection-card").forEach((card) => {
    const grid = card.querySelector(".collection-grid");
    const wrapper = card.querySelector(".collection-wrapper");
    const prevBtn = wrapper ? wrapper.querySelector(".nav-prev") : null;
    const nextBtn = wrapper ? wrapper.querySelector(".nav-next") : null;

    if (!grid) return;

    // Get original item count
    const items = Array.from(grid.children);
    const itemCount = items.length;
    const shouldAutoScroll = itemCount > 3;

    if (shouldAutoScroll) {
      // Clear existing clones first if any (in case of re-init)
      // Actually, since we clear innerHTML in renderCollection, we are safe.
      items.forEach((item) => {
        const clone = item.cloneNode(true);
        // Ensure cloned item onclick uses the same optimized path logic if passed as string literal
        grid.appendChild(clone);
      });
    }

    let scrollSpeed = 1.8; // Faster scroll
    let isPaused = false;
    let autoScrollReq;

    function autoScroll() {
      if (shouldAutoScroll && !isPaused) {
        grid.scrollLeft += scrollSpeed;
        // Fix loop reset logic to be seamless
        if (grid.scrollLeft >= grid.scrollWidth / 2) {
          grid.scrollLeft = 1; // Slight offset to prevent 0-lock
        }
      }
      autoScrollReq = requestAnimationFrame(autoScroll);
    }

    if (prevBtn) {
      // Remove old event listeners to prevent duplicates if re-initialized
      const newPrevBtn = prevBtn.cloneNode(true);
      if (prevBtn.parentNode)
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

      newPrevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        isPaused = true; // Pause to prevent fighting

        const scrollAmount = 600; // Adjusted for better card width match

        gsap.to(grid, {
          scrollLeft: grid.scrollLeft - scrollAmount,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            isPaused = false; // Resume
          },
        });
      });
    }

    if (nextBtn) {
      const newNextBtn = nextBtn.cloneNode(true);
      if (nextBtn.parentNode)
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

      newNextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        isPaused = true;

        const scrollAmount = 600;

        gsap.to(grid, {
          scrollLeft: grid.scrollLeft + scrollAmount,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            isPaused = false;
          },
        });
      });
    }

    if (shouldAutoScroll) {
      // Cancel previous if any (tough to track without global state, but basic impl here)
      autoScroll();

      // Pause on hover
      grid.addEventListener("mouseenter", () => {
        isPaused = true;
      });
      grid.addEventListener("mouseleave", () => {
        isPaused = false;
      });
    }
  });
}

// DOWNLOAD FUNCTIONS
// DYNAMIC WALLPAPER LOADING
let collections = {};
let allWallpapers = [];

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchResultsCard = document.getElementById("search-results-card");
  const searchGrid = document.getElementById("search-grid");
  const searchCount = document.getElementById("search-count");
  const searchQueryDisplay = document.getElementById("search-query-display");

  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    // Re-query cards every time to ensure we get any dynamically added ones,
    // though for now they are static blocks.
    const allCollectionCards = document.querySelectorAll(
      ".collection-card:not(#search-results-card)"
    );

    if (query.length === 0) {
      searchResultsCard.style.display = "none";
      allCollectionCards.forEach((card) => (card.style.display = "block"));
      initScrollReveal(); // Re-trigger animations
      return;
    }

    // Toggle Views
    searchResultsCard.style.display = "block";
    allCollectionCards.forEach((card) => (card.style.display = "none"));

    searchQueryDisplay.textContent = `RESULTS FOR "${e.target.value.toUpperCase()}"`;

    // Filter Logic
    // Filter Logic
    // 1. Tokenize query
    const tokens = query.split(/\s+/).filter((token) => token.length > 0);

    // 2. Define noise words to ignore if they are part of a longer query
    const noiseWords = [
      "wallpaper",
      "wallpapers",
      "background",
      "backgrounds",
      "image",
      "images",
      "hd",
      "4k",
    ];

    // Only filter out noise words if there are other meaningful tokens
    const meaningfulTokens = tokens.filter((t) => !noiseWords.includes(t));
    const searchTokens =
      meaningfulTokens.length > 0 ? meaningfulTokens : tokens;

    const matching = allWallpapers.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const categoryLower = item.category.toLowerCase();

      // Check if EVERY search token is present in either title or category
      return searchTokens.every(
        (token) => titleLower.includes(token) || categoryLower.includes(token)
      );
    });

    searchCount.textContent = `${matching.length} IMAGE${
      matching.length !== 1 ? "S" : ""
    }`;

    // Render Logic
    searchGrid.innerHTML = "";
    if (matching.length === 0) {
      searchGrid.innerHTML = `<div style="text-align:center; grid-column: 1/-1; padding: 4rem; color: #a0a0a0; font-family: 'Bebas Neue'; font-size: 1.5rem;">NO MATCHES FOUND</div>`;
    } else {
      matching.forEach((item) => {
        const gridItem = document.createElement("div");
        gridItem.className = "grid-item reveal active"; // Force active for immediate show
        gridItem.onclick = () =>
          openLightbox(
            item.optimized + "?v=" + Date.now(),
            item.title,
            item.original
          );
        gridItem.innerHTML = `
          <img src="${item.optimized}?v=${Date.now()}" alt="${
          item.title
        }" loading="lazy" />
          <div class="item-overlay">
            <button class="btn-quick-download" onclick="event.stopPropagation(); downloadImage('${
              item.original
            }')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        `;
        searchGrid.appendChild(gridItem);
      });
    }
  });
}

async function loadWallpapers() {
  try {
    const response = await fetch(`wallpapers.json?v=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to load wallpapers.json");

    const data = await response.json();

    // Flatten data for search
    allWallpapers = [];
    Object.keys(data).forEach((category) => {
      data[category].forEach((item) => {
        allWallpapers.push({ ...item, category });
      });
    });

    initSearch();

    // Update Hero Stats (Run this early to ensure UI updates)
    try {
      const totalWallpapers = Object.values(data).reduce(
        (acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0),
        0
      );
      // Round down to nearest 5 (e.g., 57 -> 55, 62 -> 60)
      const roundedCount = Math.floor(totalWallpapers / 5) * 5;
      const totalCollections = Object.keys(data).length;

      const statWallpapers = document.getElementById("stat-wallpapers");
      const statCollections = document.getElementById("stat-collections");

      if (statWallpapers) {
        // Animate counting from 0 to roundedCount
        const counter = { val: 0 };
        gsap.to(counter, {
          val: roundedCount,
          duration: 2.5,
          ease: "power2.out",
          onUpdate: () => {
            statWallpapers.textContent = Math.floor(counter.val) + "+";
          },
        });
      }
      if (statCollections) statCollections.textContent = totalCollections;
    } catch (e) {
      console.warn("Stats update failed", e);
    }

    // Map JSON data to simple filename arrays for compatibility with downloadCollection
    Object.keys(data).forEach((category) => {
      collections[category] = data[category].map((item) => item.original);
      renderCollection(category, data[category]);
    });

    // Start preloading
    preloadImages(data);

    // Re-initialize logic that depends on DOM content
    // We need to wait for DOM to be populated before initializing sliders
    setTimeout(() => {
      initAutoScroll();
      if (typeof initScrollReveal === "function") initScrollReveal();
    }, 100);
  } catch (error) {
    console.error("Error loading wallpapers:", error);
    showNotification("Failed to load wallpapers!", "error");
  }
}

function renderCollection(category, items) {
  const card = document.querySelector(
    `.collection-card[data-collection="${category}"]`
  );
  if (!card) return;

  const grid = card.querySelector(".collection-grid");
  if (!grid) return;

  // Clear existing static content if any (though we will remove it from HTML too)
  grid.innerHTML = "";

  // Update count in header
  const countTag = card.querySelector(".meta-tag:first-child");
  if (countTag) {
    const count = items.length;
    countTag.textContent = `${count} IMAGE${count !== 1 ? "S" : ""}`;
  }

  // Category display names for better alt text
  const categoryNames = {
    anime: "Anime",
    marvel: "Marvel",
    movies: "Movies & TV Shows",
    cars: "Cars & Supercars",
    transformers: "Transformers",
    random: "Random",
  };

  const categoryName = categoryNames[category] || category;

  items.forEach((item) => {
    // Generate URL-friendly ID from filename
    const wallpaperId = item.file
      .replace(/\.(jpg|jpeg|png|webp)$/i, "")
      .replace(/[_\s]+/g, "-")
      .toLowerCase();

    const gridItem = document.createElement("div");
    gridItem.className = "grid-item";
    gridItem.dataset.wallpaperId = wallpaperId; // Store ID for stats loading

    // Generate SEO-friendly alt text
    const altText = `${item.title} - ${categoryName} HD Wallpaper | Free Download | WallpaperVerse`;

    // Click opens lightbox for quick view, but also has link to individual page
    gridItem.onclick = () =>
      openLightbox(
        item.optimized + "?v=" + Date.now(),
        item.title,
        item.original
      );

    // Use optimized images for better quality display
    const displayImage = item.optimized + "?v=" + Date.now();
    gridItem.innerHTML = `
      <img src="${displayImage}" alt="${altText}" loading="lazy" />
      <div class="download-count-badge" data-id="${wallpaperId}">⬇ 0</div>
      <div class="item-overlay">
        <a href="wallpaper.html?id=${wallpaperId}" class="btn-view-page" aria-label="View ${item.title} page" onclick="event.stopPropagation()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
        <button class="btn-quick-download" aria-label="Download ${item.title} wallpaper" onclick="event.stopPropagation(); downloadImage('${item.original}')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    `;

    grid.appendChild(gridItem);
  });

  // Load stats for this category's wallpapers
  loadWallpaperStats(items);
}

// Load download stats for wallpapers
async function loadWallpaperStats(items) {
  if (!window.supabaseClient) {
    // Retry after Supabase loads
    setTimeout(() => loadWallpaperStats(items), 1000);
    return;
  }

  try {
    // Get all wallpaper IDs
    const ids = items.map((item) =>
      item.file
        .replace(/\.(jpg|jpeg|png|webp)$/i, "")
        .replace(/[_\s]+/g, "-")
        .toLowerCase()
    );

    // Fetch stats for all these wallpapers
    const { data } = await window.supabaseClient
      .from("wallpaper_stats")
      .select("id, downloads")
      .in("id", ids);

    if (data) {
      data.forEach((stat) => {
        const badge = document.querySelector(
          `.download-count-badge[data-id="${stat.id}"]`
        );
        if (badge && stat.downloads > 0) {
          badge.textContent = `⬇ ${formatDownloadCount(stat.downloads)}`;
          badge.classList.add("has-downloads");
        }
      });
    }
  } catch (error) {
    console.log("Stats loading skipped");
  }
}

// Format download count for display
function formatDownloadCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Call init immediately
// Only run main data loading on pages that need it (Home)
if (
  document.getElementById("searchInput") ||
  document.querySelector(".collection-card")
) {
  loadWallpapers();
}

async function downloadImage(imageUrl) {
  try {
    // Track download in analytics
    trackDownloadFromGallery(imageUrl);

    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = imageUrl.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Downloaded!");
  } catch (error) {
    console.error("Download failed:", error);
    showNotification("Download failed!", "error");
  }
}

// Track download from gallery (extract ID from URL)
async function trackDownloadFromGallery(imageUrl) {
  if (!window.supabaseClient) return;

  try {
    // Extract filename and generate ID
    const filename = imageUrl.split("/").pop();
    const wallpaperId = filename
      .replace(/\.(jpg|jpeg|png|webp)$/i, "")
      .replace(/[_\s]+/g, "-")
      .toLowerCase();

    // Check if record exists - use maybeSingle to avoid error when no row exists
    const { data: existing, error } = await window.supabaseClient
      .from("wallpaper_stats")
      .select("downloads")
      .eq("id", wallpaperId)
      .maybeSingle();

    if (existing) {
      await window.supabaseClient
        .from("wallpaper_stats")
        .update({ downloads: existing.downloads + 1 })
        .eq("id", wallpaperId);
    } else {
      await window.supabaseClient
        .from("wallpaper_stats")
        .insert({ id: wallpaperId, views: 0, downloads: 1 });
    }
    console.log("⬇ Download tracked:", wallpaperId);
  } catch (error) {
    // Silently handle errors - don't break downloads
  }
}

async function downloadCollection(collectionName) {
  const files = collections[collectionName];
  if (!files) {
    showNotification("Collection not found!", "error");
    return;
  }

  showNotification(`Preparing ${files.length} wallpapers...`, "info");

  try {
    const zip = new JSZip();
    const folder = zip.folder(collectionName);

    const promises = files.map(async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const cleanName = url.split("/").pop(); // Extract filename from path
      folder.file(cleanName, blob);
    });

    await Promise.all(promises);

    showNotification("Creating ZIP...", "info");
    const content = await zip.generateAsync({ type: "blob" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `${collectionName}-wallpapers.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    showNotification("ZIP downloaded!");
  } catch (error) {
    console.error("Download failed:", error);
    showNotification("Download failed!", "error");
  }
}

function showNotification(message, type = "success") {
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 2rem;
    padding: 1rem 2rem;
    background: ${
      type === "error" ? "#FF0040" : type === "info" ? "#00D9FF" : "#FFD700"
    };
    color: #0d0d0d;
    font-family: "Bebas Neue", sans-serif;
    font-size: 1.2rem;
    letter-spacing: 0.05em;
    border-radius: 4px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    z-index: 10000;
    clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);
    animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
  `;

  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// LIGHTBOX
function openLightbox(imageSrc, imageAlt, originalSrc = null) {
  const downloadUrl = originalSrc || imageSrc;
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";

  lightbox.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    cursor: pointer;
    opacity: 0;
  `;

  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = imageAlt;
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border: 4px solid #00D9FF;
    box-shadow: 0 20px 60px rgba(0, 217, 255, 0.5);
    cursor: default;
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML =
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  closeBtn.style.cssText = `
    position: absolute;
    top: 2rem;
    right: 2rem;
    width: 60px;
    height: 60px;
    background: #00D9FF;
    color: #0d0d0d;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 217, 255, 0.5);
  `;

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.background = "#FF0040";
    closeBtn.style.transform = "scale(1.1) rotate(90deg)";
  });

  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.background = "#00D9FF";
    closeBtn.style.transform = "scale(1) rotate(0deg)";
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  downloadBtn.style.cssText = `
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    padding: 1.2rem 2.5rem;
    background: linear-gradient(135deg, #00D9FF, #FF0040);
    color: #0d0d0d;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: "Bebas Neue", sans-serif;
    font-size: 1.2rem;
    letter-spacing: 0.05em;
    clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);
    transition: all 0.3s ease;
    box-shadow: 0 8px 20px rgba(0, 217, 255, 0.4);
  `;

  downloadBtn.addEventListener("mouseenter", () => {
    downloadBtn.style.transform = "translateY(-5px) scale(1.05)";
    downloadBtn.style.boxShadow = "0 12px 30px rgba(0, 217, 255, 0.6)";
  });

  downloadBtn.addEventListener("mouseleave", () => {
    downloadBtn.style.transform = "translateY(0) scale(1)";
    downloadBtn.style.boxShadow = "0 8px 20px rgba(0, 217, 255, 0.4)";
  });

  downloadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    downloadImage(downloadUrl);
  });

  lightbox.appendChild(img);
  lightbox.appendChild(closeBtn);
  lightbox.appendChild(downloadBtn);
  document.body.appendChild(lightbox);
  document.body.style.overflow = "hidden";

  // GSAP Animation for Lightbox Entry
  gsap.to(lightbox, { opacity: 1, duration: 0.3 });
  gsap.to(img, { scale: 1, duration: 0.4, ease: "back.out(1.5)" });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  closeBtn.addEventListener("click", closeLightbox);

  function handleEscape(e) {
    if (e.key === "Escape") closeLightbox();
  }
  document.addEventListener("keydown", handleEscape);

  lightbox.cleanup = () =>
    document.removeEventListener("keydown", handleEscape);

  function closeLightbox() {
    gsap.to(lightbox, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        lightbox.remove();
        document.body.style.overflow = "";
        if (lightbox.cleanup) lightbox.cleanup();
      },
    });
    gsap.to(img, { scale: 0.9, duration: 0.3 });
  }
}

console.log("⚡ WALLPAPERVERSE ⚡");

// SCROLL REVEAL ANIMATIONS
const initScrollReveal = () => {
  const revealElements = document.querySelectorAll(
    ".grid-item, .collection-title, .collection-desc, .section-title, .btn-download-all"
  );

  revealElements.forEach((el) => el.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        } else {
          entry.target.classList.remove("active");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
};

// Initialize ScrollReveal safely
if (typeof initScrollReveal === "function") initScrollReveal();

// Initialize main logic after DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
  // Console check for GSAP
  if (typeof gsap === "undefined") {
    console.warn("GSAP not loaded! Check internet connection or CDN limits.");
    return;
  }

  // Register plugins safely
  if (
    typeof ScrollTrigger !== "undefined" &&
    typeof ScrollToPlugin !== "undefined"
  ) {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  }

  // Define global toggleMenu for HTML onclick access
  window.toggleMenu = function () {
    const navLinks = document
      .getElementById("mainNav")
      .querySelector(".nav-right");
    const toggleBtn = document.querySelector(".mobile-toggle");

    if (navLinks && toggleBtn) {
      navLinks.classList.toggle("active");
      toggleBtn.classList.toggle("active");
      document.body.style.overflow = navLinks.classList.contains("active")
        ? "hidden"
        : "auto";
    }
  };
});
