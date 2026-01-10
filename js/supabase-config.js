// Supabase Configuration
const SUPABASE_URL = "https://sfivykqorsflcgctqzyu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXZ5a3FvcnNmbGNnY3Rxenl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTU3MzEsImV4cCI6MjA4MzM3MTczMX0.arx11KgRsnFP4SjBavLKnwD4dtyS10dHnSNQJhpfpYA";

// Wait for Supabase SDK to load, then initialize
function initSupabase() {
  if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
    const client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    window.supabaseClient = client;
    console.log("🚀 Supabase initialized");
    return true;
  }
  return false;
}

// Try immediately
if (!initSupabase()) {
  // If SDK not ready, wait a bit and try again
  setTimeout(() => {
    if (!initSupabase()) {
      console.error("❌ Supabase SDK failed to load");
    }
  }, 500);
}
