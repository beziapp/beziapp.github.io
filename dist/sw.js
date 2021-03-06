




// @begin=js@
// Change version to cause cache refresh
const static_cache_name = "site-static-1.0.16.2-beta-90dfb78";
// commit before the latest is 90dfb784cc11a8cc52e3cfb063273f44849f62a1
// Got them with find . -not -path '*/\.*' | sed "s/.*/\"&\",/" | grep -v sw.js
// sw.js NE SME BITI CACHAN, ker vsebuje verzijo!

const assets = [
	"/css/materialize.min.css",
	"/css/fontawesome.min.css",
	"/css/materialicons.css",
	"/css/styles.css",
	"/css/fullcalendar/custom.css",
	"/css/fullcalendar/daygrid/main.min.css",
	"/css/fullcalendar/core/main.min.css",
	"/css/fullcalendar/timegrid/main.min.css",

	"/fonts/fa-solid-900.eot",
	"/fonts/fa-solid-900.woff2",
	"/fonts/fa-brands-400.woff2",
	"/fonts/fa-regular-400.eot",
	"/fonts/fa-regular-400.woff2",
	"/fonts/fa-brands-400.eot",
	"/fonts/materialicons.woff2",

	"/img/avatars/asijanec.png",
	"/img/avatars/rstular.png",
	"/img/icons/icon_384.png",
	"/img/icons/icon_192.png",
	"/img/icons/icon_72.png",
	"/img/icons/icon_144.png",
	"/img/icons/icon_512.png",
	"/img/icons/icon_96.png",
	"/img/icons/icon_48.png",

	"/js/timetable.js",
	"/js/gradings.js",
	"/js/messaging.js",
	"/js/privacypolicy.js",
	"/js/teachers.js",
	"/js/tos.js",
	"/js/login.js",
	"/js/app.js",
	"/js/meals.js",
	"/js/settings.js",
	"/js/lang/bundle.js",
	"/js/setup-storage.js",

	"/js/lib/materialize.min.js",
	"/js/lib/jquery.min.js",
	"/js/lib/localforage.min.js",
	"/js/lib/xss.js",
	"/js/lib/mergedeep.js",

	"/js/lib/fullcalendar/daygrid/main.min.js",
	"/js/lib/fullcalendar/core/main.min.js",
	"/js/lib/fullcalendar/timegrid/main.min.js",
	"/js/grades.js",
	"/js/about.js",
	"/js/logout.js",
	"/js/initialize.js",
	"/js/absences.js",
	"/js/changelog.js",

	"/pages/timetable.html",
	"/pages/teachers.html",
	"/pages/absences.html",
	"/pages/about.html",
	"/pages/changelog.html",
	"/pages/messaging.html",
	"/pages/gradings.html",
	"/pages/grades.html",
	"/pages/privacypolicy.html",
	"/pages/tos.html",
	"/pages/meals.html",
	"/pages/settings.html",

	"/manifest.json",
	"/index.html",
	"/login.html",
	"/logout.html",
	"/favicon.png",
	"/pages/jitsi.html",
	"/js/jitsi.js",
	"/pages/chats.html",
	"/js/chats.js",
	"/css/bubbles.css",

	"/js/gsec.js",
	"/js/gsec.js?ajaxload"
];

importScripts("/js/lib/localforage.min.js");
importScripts("/js/setup-storage.js");
self.addEventListener("install", (evt) => {
	// Add localforage.clear() if storage purge is required
	evt.waitUntil(
		// localforage.clear()
		setupStorage()
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

async function sw_asynclycheckversion (data) {
	try {
		var names = await caches.keys();
		console.log("[sw.js] checkversion: ***** checkversion v0 for BežiApp ***** hello, world!");
		if(!(data.valid_cache_name == undefined || data.valid_cache_name == null || data.valid_cache_name == "")) {
			var valid_cache_name = data.valid_cache_name;
			console.log("[sw.js] checkversion: requested version (cachename) " + valid_cache_name);
		} else {
			var valid_cache_name = static_cache_name;
			console.log("[sw.js] checkversion: no version to keep specified, using current "+valid_cache_name+", but that makes no sense to me.");
		}
		console.log("[sw.js] checkversion: deleting caches that don't match that cache name ...");
		for (let name of names) {
			if(valid_cache_name != name) {
				caches.delete(name);
				console.log("[sw.js] checkversion: done requesting delete of cache " + name);
			}
		}
		console.log("[sw.js] checkversion: done, exiting!");
	} catch (e) {
		console.log("[sw.js] checkversion: !!! ERRORS! (caught)");
	}
}

self.addEventListener("message", event => {

	if (event.data) {
		let data = JSON.parse(event.data); // parse the message back to JSON
		if (data.action == "addtocache") { // check the action
			event.waitUntil(
				caches.open(static_cache_name).then(function (cache) {
					try {
						return cache.add([data.url]);
					}
					catch (error) {
						console.error("[sw.js] error: " + error);
					}
				})
			);
		} else if (data.action == "deletecaches") {
			caches.keys().then(function (names) {
				for (let name of names) {
					console.log("[sw.js] deleting cache named " + name);
					caches.delete(name);
				}
			});
		} else if (data.action.startsWith("checkversion")) {
			sw_asynclycheckversion(data);
		}
	}
});

self.addEventListener("fetch", (evt) => {
	evt.respondWith(caches.match(evt.request).then((cache_res) => {
		return cache_res || fetch(evt.request);
	}))
});
