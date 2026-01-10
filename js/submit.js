// Submit Page JavaScript - Supabase Version
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// DOM Elements
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const previewContainer = document.getElementById("previewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeBtn = document.getElementById("removeBtn");
const fileInfo = document.getElementById("fileInfo");
const submitForm = document.getElementById("submitForm");
const submitBtn = document.getElementById("submitBtn");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const successModal = document.getElementById("successModal");

let selectedFile = null;

// Mobile Menu Toggle
function toggleMenu() {
  const navRight = document.querySelector(".nav-right");
  const mobileToggle = document.querySelector(".mobile-toggle");
  if (navRight && mobileToggle) {
    navRight.classList.toggle("active");
    mobileToggle.classList.toggle("active");
  }
}

// Upload Zone Click
uploadZone.addEventListener("click", () => fileInput.click());

// Drag and Drop handlers
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("drag-over");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

// File Input Change
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// Handle File Selection
function handleFile(file) {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    showNotification("Please upload a JPG, PNG, or WEBP image.", "error");
    return;
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    showNotification("File size must be 50MB or less.", "error");
    return;
  }

  selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    uploadZone.style.display = "none";
    previewContainer.style.display = "block";
    fileInfo.textContent = `${file.name} • ${formatFileSize(file.size)}`;
  };
  reader.readAsDataURL(file);
}

// Remove selected file
removeBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";
  previewContainer.style.display = "none";
  uploadZone.style.display = "block";
  imagePreview.src = "";
});

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Form Submit
submitForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedFile) {
    showNotification("Please select an image to upload.", "error");
    return;
  }

  const title = document.getElementById("wallpaperTitle").value.trim();
  const category = document.getElementById("category").value;
  const submitterName =
    document.getElementById("submitterName").value.trim() || "Anonymous";

  if (!title || !category) {
    showNotification("Please fill in all required fields.", "error");
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>UPLOADING...</span>";
  progressContainer.style.display = "block";

  try {
    // Check if Supabase is configured
    if (!window.supabaseClient) {
      throw new Error(
        "Supabase not configured. Please set up supabase-config.js"
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const extension = selectedFile.name.split(".").pop();
    const fileName = `${category}/${timestamp}-${safeName}.${extension}`;

    // Simulate progress (Supabase doesn't have progress events for small files)
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        progressFill.style.width = progress + "%";
        progressText.textContent = `Uploading... ${progress}%`;
      }
    }, 200);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } =
      await window.supabaseClient.storage
        .from("wallpaper submissions")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

    clearInterval(progressInterval);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = window.supabaseClient.storage
      .from("wallpaper submissions")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Get user IP address
    let userIP = "unknown";
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();
      userIP = ipData.ip;
    } catch (e) {
      console.log("Could not fetch IP");
    }

    // Save to Supabase Database
    const { error: dbError } = await window.supabaseClient
      .from("submissions")
      .insert([
        {
          title: title,
          category: category,
          submitter_name: submitterName,
          image_url: imageUrl,
          file_name: fileName,
          file_size: selectedFile.size,
          status: "pending",
          ip_address: userIP,
        },
      ]);

    if (dbError) {
      throw dbError;
    }

    // Show success
    progressFill.style.width = "100%";
    progressText.textContent = "Upload complete!";

    setTimeout(() => {
      successModal.classList.add("active");
      resetForm();
    }, 500);
  } catch (error) {
    console.error("Submission error:", error);
    showNotification(
      error.message || "Submission failed. Please try again.",
      "error"
    );
    resetForm();
  }
});

// Reset form after submission
function resetForm() {
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span>SUBMIT WALLPAPER</span>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  progressContainer.style.display = "none";
  progressFill.style.width = "0%";
  selectedFile = null;
  fileInput.value = "";
  previewContainer.style.display = "none";
  uploadZone.style.display = "block";
  submitForm.reset();
}

// Close modal
function closeModal() {
  successModal.classList.remove("active");
}

// Close modal on background click
successModal.addEventListener("click", (e) => {
  if (e.target === successModal) {
    closeModal();
  }
});

// Notification system
function showNotification(message, type = "success") {
  // Remove existing notifications
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${
      type === "error" ? "rgba(255, 0, 60, 0.9)" : "rgba(0, 255, 136, 0.9)"
    };
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1500;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Add animation keyframes if not exists
  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

console.log("📤 Submit page loaded (Supabase)");
