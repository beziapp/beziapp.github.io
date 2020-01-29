// Change version to cause cache refresh
const static_cache_name = "site-static-v1.0.3";
// Got them with du -a and minor cleaning up
const assets = [
    "/img/avatars/asijanec.png",
    "/img/avatars/rstular.png",

    "/img/icons/icon_144.png",
    "/img/icons/icon_192.png",
    "/img/icons/icon_72.png",
    "/img/icons/icon_384.png",
    "/img/icons/icon_48.png",
    "/img/icons/icon_96.png",
    "/img/icons/icon_512.png",

    "/pages/absences.html",
    "/pages/about.html",
    "/pages/gradings.html",
    "/pages/grades.html",
    "/pages/teachers.html",
    "/pages/timetable.html",
    "/pages/tos.html",
    "/pages/privacypolicy.html",

    "/fonts/materialicons.woff2",
    "/fonts/fa-regular-400.eot",
    "/fonts/fa-regular-400.woff2",
    "/fonts/fa-solid-900.woff2",
    "/fonts/fa-solid-900.eot",
    "/fonts/fa-brands-400.woff2",
    "/fonts/fa-brands-400.eot",

    "/css/fontawesome.min.css",
    "/css/fullcalendar/custom.css",
    "/css/fullcalendar/daygrid/main.min.css",
    "/css/fullcalendar/timegrid/main.min.css",
    "/css/fullcalendar/core/main.min.css",
    "/css/styles.css",
    "/css/materialicons.css",
    "/css/materialize.min.css",

    "/js/gradings.js",
    "/js/login.js",
    "/js/logout.js",
    "/js/teachers.js",
    "/js/initialize.js",
    "/js/timetable.js",
    "/js/about.js",
    "/js/app.js",
    "/js/grades.js",
    "/js/absences.js",
    "/js/tos.js",
    "/js/privacypolicy.js",

    "/js/lib/materialize.min.js",
    "/js/lib/fullcalendar/daygrid/main.min.js",
    "/js/lib/fullcalendar/timegrid/main.min.js",
    "/js/lib/fullcalendar/core/main.min.js",
    "/js/lib/localforage.min.js",
    "/js/lib/jquery.min.js",

    "/favicon.png",
    "/",
    "/index.html",
    "/login.html",
    "/logout.html"
];

importScripts("/js/lib/localforage.min.js");

self.addEventListener("install", (evt) => {
    // Add localforage.clear() if storage purge is required
    evt.waitUntil(
        localforage.clear()
    );

    evt.waitUntil(
        caches.open(static_cache_name).then((cache) => {
            cache.addAll(assets);
        })
    );
});

// Delete old caches
self.addEventListener("activate", evt => {
    evt.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys
                .filter(key => key !== static_cache_name)
                .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener("fetch", (evt) => {
    evt.respondWith(caches.match(evt.request).then((cache_res) => {
        return cache_res || fetch(evt.request);
    }))
});
