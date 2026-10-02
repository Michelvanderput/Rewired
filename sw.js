/* Offline support: cache the app shell, GSAP and fonts */
const VERSION = "rewired-v11";
const SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "js/monitor.js",
  "js/data.js",
  "js/store.js",
  "js/audio.js",
  "js/fx.js",
  "js/push.js",
  "js/sync.js",
  "js/habits.js",
  "js/recap.js",
  "js/rewards.js",
  "js/apptrack.js",
  "js/lessons.js",
  "js/lessons2.js",
  "js/learn.js",
  "js/tools.js",
  "js/app.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/vendor/gsap.min.js"
];

self.addEventListener("install", e => {
  // cache files one by one so a single failure doesn't block installation
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first for our own files (so updates arrive), cache first for CDN/fonts.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  if (sameOrigin && url.pathname.startsWith("/api/")) return; // never cache the push API

  if (sameOrigin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
    );
  } else {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }))
    );
  }
});

/* ---------- Push notifications ---------- */
self.addEventListener("push", e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  const title = data.title || "Rewired";
  e.waitUntil(Promise.all([
    self.clients.matchAll({ type: "window" }).then(list => list.forEach(c => c.postMessage({ type: "push", title, body: data.body || "" }))),
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      tag: data.tag || "rewired",
      data: { url: data.url || "./" }
    }),
    self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge(1).catch(() => {}) : null
  ]));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = new URL(e.notification.data && e.notification.data.url || "./", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const open = new URL(target).searchParams.get("open");
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope)) {
          c.postMessage({ type: "open", open });
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
