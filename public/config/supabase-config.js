// public/config/supabase-config.js

// These were the Supabase details provided by the user earlier.
const SUPABASE_URL = 'http://192.168.10.18:8001';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM5OTgwODAwLAogICJleHAiOiAxODk3NzQ3MjAwCn0.UsUZbPq7y6Lk7pytc6ij5NiHpf5kk_hqas8C_HKBVJQ';

let supabase = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully in supabase-config.js.');
    } else {
        console.error('Supabase client library (supabase-js) not found. Make sure it is loaded before this script.');
        // Attempt to load it dynamically if not present (less ideal for production)
        // For now, we assume it's loaded via CDN in each HTML file before this config script.
    }
} catch (error) {
    console.error('Error initializing Supabase client in supabase-config.js:', error);
}

// Export the supabase client instance so it can be imported into other modules.
// Note: HTML files will load this script, and it will attach `supabase` to the window or make it available globally.
// For module-based JS, we'd ideally use ES6 exports, but given the multiple HTML files,
// ensuring it's available globally or via a shared object might be simpler if not using a bundler.
// For now, let's assume other scripts can access `supabase` if this script is loaded first.
// A more robust module approach would be to ensure this script is loaded, then other modules import it.
// The script tags in HTML are currently `<script src="config/supabase-config.js"></script>`
// then `<script src="assets/js/main-app.js" type="module"></script>`
// then page specific controllers.
// So, `main-app.js` and controllers should be able to access `supabase` if it's made global here,
// or we can export it and they can import. Let's try exporting.

export { supabase }; // This makes it available for ES6 import in other modules
