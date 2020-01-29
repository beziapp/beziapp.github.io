const static_cache_name = "site-static-v1";
// Got them with du -a and minor cleaning up
const assets = [
    "/",
    "/index.html",
    "/login.html",
    "/favicon.png",

    "/img/icons/icon_144.png",
    "/img/icons/icon_192.png",
    "/img/icons/icon_72.png",
    "/img/icons/icon_384.png",
    "/img/icons/icon_48.png",
    "/img/icons/icon_96.png",
    "/img/icons/icon_512.png",

    "/pages/absences.html",
    "/pages/gradings.html",
    "/pages/grades.html",
    "/pages/teachers.html",
    "/pages/timetable.html",

    "/css/fullcalendar/custom.css",
    "/css/fullcalendar/daygrid/main.min.css",
    "/css/fullcalendar/timegrid/main.min.css",
    "/css/fullcalendar/core/main.min.css",
    "/css/styles.css",
    "/css/materialicons.css",
    "/css/materialize.min.css",

    "/js/gradings.js",
    "/js/login.js",
    "/js/teachers.js",
    "/js/initialize.js",
    "/js/timetable.js",
    "/js/app.js",
    "/js/grades.js",
    "/js/absences.js",

    "/js/lib/materialize.min.js",
    "/js/lib/fullcalendar/daygrid/main.min.js",
    "/js/lib/fullcalendar/timegrid/main.min.js",
    "/js/lib/fullcalendar/core/main.min.js",
    "/js/lib/localforage.min.js",
    "/js/lib/jquery.min.js"
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

self.addEventListener("activate", evt => {

})

self.addEventListener("fetch", (evt) => {

});