// Admin Panel JavaScript - Supabase Version

// Simple admin password (CHANGE THIS!)
const ADMIN_PASSWORD = "wallpaperverse2026";

let isLoggedIn = false;
let currentFilter = "pending";
let allSubmissions = [];

// DOM Elements
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const submissionsGrid = document.getElementById("submissionsGrid");

// Check session
function checkSession() {
  const session = sessionStorage.getItem("adminLoggedIn");
  if (session === "true") {
    isLoggedIn = true;
    showDashboard();
  }
}

// Login handler
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const password = document.getElementById("adminPassword").value;

  if (password === ADMIN_PASSWORD) {
    isLoggedIn = true;
    sessionStorage.setItem("adminLoggedIn", "true");
    showDashboard();
  } else {
    alert("Incorrect password");
  }
});

// Show dashboard
function showDashboard() {
  loginSection.style.display = "none";
  dashboardSection.style.display = "block";
  document.getElementById("navLogout").style.display = "flex";
  loadSubmissions();
}

// Logout
function logout() {
  isLoggedIn = false;
  sessionStorage.removeItem("adminLoggedIn");
  loginSection.style.display = "block";
  dashboardSection.style.display = "none";
  document.getElementById("navLogout").style.display = "none";
  document.getElementById("adminPassword").value = "";
}

// Load submissions from Supabase
async function loadSubmissions() {
  try {
    if (!window.supabaseClient) {
      submissionsGrid.innerHTML = `
        <div class="empty-state">
          <p>Supabase not configured. Please set up supabase-config.js</p>
        </div>
      `;
      return;
    }

    const { data, error } = await window.supabaseClient
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allSubmissions = data || [];
    updateStats();
    renderSubmissions();
  } catch (error) {
    console.error("Error loading submissions:", error);
    submissionsGrid.innerHTML = `
      <div class="empty-state">
        <p>Error loading submissions: ${error.message}</p>
      </div>
    `;
  }
}

// Update stats
function updateStats() {
  const pending = allSubmissions.filter((s) => s.status === "pending").length;
  const approved = allSubmissions.filter((s) => s.status === "approved").length;
  const rejected = allSubmissions.filter((s) => s.status === "rejected").length;

  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("approvedCount").textContent = approved;
  document.getElementById("rejectedCount").textContent = rejected;
}

// Filter submissions
function filterSubmissions(status) {
  currentFilter = status;

  // Update active tab
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.status === status);
  });

  renderSubmissions();
}

// Render submissions
function renderSubmissions() {
  const filtered = allSubmissions.filter((s) => s.status === currentFilter);

  if (filtered.length === 0) {
    submissionsGrid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <p>No ${currentFilter} submissions</p>
      </div>
    `;
    return;
  }

  submissionsGrid.innerHTML = filtered
    .map(
      (submission) => `
    <div class="submission-card" data-id="${submission.id}">
      <img src="${submission.image_url}" alt="${
        submission.title
      }" class="submission-image" 
           onclick="window.open('${
             submission.image_url
           }', '_blank')" style="cursor: pointer;" />
      <div class="submission-info">
        <span class="status-badge status-${
          submission.status
        }">${submission.status.toUpperCase()}</span>
        <div class="submission-title">${escapeHtml(submission.title)}</div>
        <div class="submission-meta">
          <span><strong>Category:</strong> ${submission.category}</span>
          <span><strong>By:</strong> ${escapeHtml(
            submission.submitter_name || "Anonymous"
          )}</span>
          <span><strong>Size:</strong> ${formatFileSize(
            submission.file_size
          )}</span>
          <span><strong>Date:</strong> ${formatDate(
            submission.created_at
          )}</span>
          <span><strong>IP:</strong> ${submission.ip_address || "N/A"}</span>
        </div>
        <div class="submission-actions">
          ${getActionButtons(submission)}
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// Get action buttons based on status
function getActionButtons(submission) {
  if (submission.status === "pending") {
    return `
      <button class="btn-approve" onclick="updateStatus(${submission.id}, 'approved')">APPROVE</button>
      <button class="btn-reject" onclick="updateStatus(${submission.id}, 'rejected')">REJECT</button>
    `;
  } else if (submission.status === "approved") {
    return `
      <button class="btn-download" onclick="downloadImage('${submission.image_url}', '${submission.title}')">DOWNLOAD</button>
      <button class="btn-reject" onclick="updateStatus(${submission.id}, 'rejected')">REMOVE</button>
    `;
  } else {
    return `
      <button class="btn-approve" onclick="updateStatus(${submission.id}, 'approved')">RESTORE</button>
      <button class="btn-download" onclick="deleteSubmission(${submission.id}, '${submission.file_name}')">DELETE</button>
    `;
  }
}

// Update submission status
async function updateStatus(id, newStatus) {
  try {
    const { error } = await window.supabaseClient
      .from("submissions")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) throw error;

    // Update local data
    const submission = allSubmissions.find((s) => s.id === id);
    if (submission) {
      submission.status = newStatus;
    }

    updateStats();
    renderSubmissions();

    showToast(`Submission ${newStatus}!`);
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Error updating submission: " + error.message);
  }
}

// Delete submission permanently
async function deleteSubmission(id, fileName) {
  if (
    !confirm("Are you sure you want to permanently delete this submission?")
  ) {
    return;
  }

  try {
    // Delete from Storage
    if (fileName) {
      await window.supabaseClient.storage
        .from("wallpaper submissions")
        .remove([fileName]);
    }

    // Delete from Database
    const { error } = await window.supabaseClient
      .from("submissions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Update local data
    allSubmissions = allSubmissions.filter((s) => s.id !== id);

    updateStats();
    renderSubmissions();

    showToast("Submission deleted!");
  } catch (error) {
    console.error("Error deleting submission:", error);
    alert("Error deleting submission: " + error.message);
  }
}

// Download image
function downloadImage(url, title) {
  const a = document.createElement("a");
  a.href = url;
  a.download = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".jpg";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Helper: Format file size
function formatFileSize(bytes) {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Helper: Format date
function formatDate(timestamp) {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper: Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 1rem 1.5rem;
    background: var(--color-primary);
    color: var(--color-bg);
    font-family: var(--font-display);
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    border-radius: 8px;
    z-index: 1500;
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Add animation
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => toast.remove(), 3000);
}

// Initialize
checkSession();
console.log("🔐 Admin panel loaded (Supabase)");
