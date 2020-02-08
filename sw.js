// Change version to cause cache refresh
const static_cache_name = "site-static-v1.0.8";
// Got them with find . -not -path '*/\.*' | sed "s/.*/\"&\",/"
const assets = [
".",
"./login.html",
"./logout.html",
"./css",
"./css/materialize.min.css",
"./css/fontawesome.min.css",
"./css/materialicons.css",
"./css/styles.css",
"./css/fullcalendar",
"./css/fullcalendar/custom.css",
"./css/fullcalendar/daygrid",
"./css/fullcalendar/daygrid/main.min.css",
"./css/fullcalendar/core",
"./css/fullcalendar/core/main.min.css",
"./css/fullcalendar/timegrid",
"./css/fullcalendar/timegrid/main.min.css",
"./favicon.png",
"./fonts",
"./fonts/fa-solid-900.eot",
"./fonts/fa-solid-900.woff2",
"./fonts/fa-brands-400.woff2",
"./fonts/fa-regular-400.eot",
"./fonts/fa-regular-400.woff2",
"./fonts/fa-brands-400.eot",
"./fonts/materialicons.woff2",
"./index.html",
"./sw.js",
"./img",
"./img/avatars",
"./img/avatars/asijanec.png",
"./img/avatars/rstular.png",
"./img/icons",
"./img/icons/icon_384.png",
"./img/icons/icon_192.png",
"./img/icons/icon_72.png",
"./img/icons/icon_144.png",
"./img/icons/icon_512.png",
"./img/icons/icon_96.png",
"./img/icons/icon_48.png",
"./js",
"./js/timetable.js",
"./js/gradings.js",
"./js/messaging.js",
"./js/privacypolicy.js",
"./js/teachers.js",
"./js/tos.js",
"./js/login.js",
"./js/app.js",
"./js/lib",
"./js/lib/materialize.min.js",
"./js/lib/jquery.min.js",
"./js/lib/localforage.min.js",
"./js/lib/fullcalendar",
"./js/lib/fullcalendar/daygrid",
"./js/lib/fullcalendar/daygrid/main.min.js",
"./js/lib/fullcalendar/core",
"./js/lib/fullcalendar/core/main.min.js",
"./js/lib/fullcalendar/timegrid",
"./js/lib/fullcalendar/timegrid/main.min.js",
"./js/grades.js",
"./js/about.js",
"./js/logout.js",
"./js/initialize.js",
"./js/absences.js",
"./js/changelog.js",
"./node_modules",
"./node_modules/commander",
"./node_modules/commander/CHANGELOG.md",
"./node_modules/commander/Readme.md",
"./node_modules/commander/typings",
"./node_modules/commander/typings/index.d.ts",
"./node_modules/commander/LICENSE",
"./node_modules/commander/index.js",
"./node_modules/commander/package.json",
"./node_modules/cssfilter",
"./node_modules/cssfilter/lib",
"./node_modules/cssfilter/lib/css.js",
"./node_modules/cssfilter/lib/util.js",
"./node_modules/cssfilter/lib/default.js",
"./node_modules/cssfilter/lib/index.js",
"./node_modules/cssfilter/lib/parser.js",
"./node_modules/cssfilter/LICENSE",
"./node_modules/cssfilter/package.json",
"./node_modules/cssfilter/README.md",
"./node_modules/xss",
"./node_modules/xss/README.zh.md",
"./node_modules/xss/dist",
"./node_modules/xss/dist/test.html",
"./node_modules/xss/dist/xss.js",
"./node_modules/xss/dist/xss.min.js",
"./node_modules/xss/lib",
"./node_modules/xss/lib/cli.js",
"./node_modules/xss/lib/util.js",
"./node_modules/xss/lib/default.js",
"./node_modules/xss/lib/xss.js",
"./node_modules/xss/lib/index.js",
"./node_modules/xss/lib/parser.js",
"./node_modules/xss/typings",
"./node_modules/xss/typings/xss.d.ts",
"./node_modules/xss/LICENSE",
"./node_modules/xss/package.json",
"./node_modules/xss/bin",
"./node_modules/xss/bin/xss",
"./node_modules/xss/README.md",
"./manifest.json",
"./pages",
"./pages/timetable.html",
"./pages/teachers.html",
"./pages/absences.html",
"./pages/about.html",
"./pages/changelog.html",
"./pages/messaging.html",
"./pages/gradings.html",
"./pages/grades.html",
"./pages/privacypolicy.html",
"./pages/tos.html",
"./package-lock.json"
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
