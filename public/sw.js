// Empty service worker to prevent 404 errors
// This app doesn't use service workers, but browsers may look for this file

self.addEventListener('install', () => {
  // Skip waiting
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Take control of all pages
  return self.clients.claim();
});

