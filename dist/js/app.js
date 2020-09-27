



// @begin=html@
const app_version = "1.0.16.0-beta";
const previous_commit = "d3ff5cdc069c83b631f144191c56fdee21a00ee1";
const BEZIAPP_UPDATE_INTERVAL = 300; // update vsakih 300 sekund

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("/sw.js")
		.then(() => { })
		.catch((err) => console.log("Service worker registration failed", err));
}

// Listen to messages from service workers.
if (navigator.serviceWorker) {
	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data.msg === "install") {
			window.location.replace("/index.html");
		}
	});
}

/**
 * Displays a user-friendly text to the user and
 * detailed text to developer (console)
 * @param {string} usermsg User-friendly message
 * @param {string} devmsg Developer-friendly message
 */
async function UIAlert(usermsg, devmsg) {
	if (true) { // če bo kakšen dev switch?
		M.toast({ html: usermsg });
		console.log(`[BežiApp UIAlert] ${usermsg} ${devmsg}`);
	} else {
		M.toast({ html: `${usermsg} ${devmsg}` });
	}
}

/**
 * Handles GSEC error - notifies the user and prints a console message
 * @param {Object} err GSEC error object
 */
function gsecErrorHandlerUI(err) {
	console.log(`gsecErrorHanderUI: handling ${err}`);
	if (err == GSEC_ERR_NET || err == GSEC_ERR_NET_POSTBACK_GET ||
		err == GSEC_ERR_NET_POSTBACK_POST) {

		UIAlert(D("gsecErrNet"));
	} else if (err == GSEC_ERR_LOGIN) {
		UIAlert(D("gsecErrLogin"));
		localforage.setItem("logged_in", false).then(() => {
			window.location.replace("/index.html");
		});
	} else {
		UIAlert(D("gsecErrOther"));
	}
}

var update_app_function = async function () {
	try {
		$.get("/cache_name.txt?cache_kill=" + Date.now(), (data, status) => {
			var cache_name = data.split("///")[1].split("|||")[0];
			var data_to_send = {
				action: "checkversion",
				valid_cache_name: cache_name
			}
			try {
				navigator.serviceWorker.controller.postMessage(JSON.stringify(data_to_send));
			} catch (e) {
				console.log("update requested but sw is not available in app.js");
			}
		});
	} catch (e) {
		console.log("update requested but failed because of network error probably in update_app_function in app.js");
	}
}

var error_report_function = async function (msg, url, lineNo, columnNo, error) {
	// catching everything here so no looping error shit. that's the last thing we want
	try {
		localforage.getItem("errorReporting").then(async function (value) {
			let selectedE = value;
			if (value == null || value.length < 1) {
				selectedE = "on";
			}
			if (selectedE == "on") {
				var data = {};
				data.error = { "msg": msg, "url": url, "line": lineNo, "column": columnNo, "obj": error };
				data.client = { "ua": navigator.userAgent, "app_version": app_version, "previous_commit": previous_commit, "username": null };

				// Load required data
				data.client.username = await localforage.getItem("username");

				data.type = "error";
				$.post("https://beziapp-report.gimb.tk/", data);
			} else {
				console.log("error not reported as reporting is disabled!");
			}
		}).catch(() => { });
		return false;
	} catch (e) {
		console.log("error_erport_function: !!! ERROR! (caught) - probably some network error.");
	}
}

window.onerror = error_report_function;
window.onunhandledrejection = error_report_function;

async function try_app_update() {
	localforage.getItem("lastUpdate").then((data) => {
		if (Math.floor(Date.now() / 1000) > Number(data) + BEZIAPP_UPDATE_INTERVAL) {
			// trigger an update
			localforage.setItem("lastUpdate", Math.floor(Date.now() / 1000)).then(() => {
				update_app_function();
			});
		}
	});
}

document.addEventListener("DOMContentLoaded", () => {
	try_app_update();
	var update_interval = setInterval(() => {

		try_app_update();

	}, 1000 * BEZIAPP_UPDATE_INTERVAL);
});

// @begin=js@

var BEZIAPP_USERNAME, BEZIAPP_PASSWORD, BEZIAPP_LOPOLIS_USERNAME, BEZIAPP_LOPOLIS_PASSWORD, BEZIAPP_LANGUAGE, BEZIAPP_THEME, BEZIAPP_ERRORREPORTING;

let promises_to_run_app = [
	localforage.getItem("username").then((value) => {
		BEZIAPP_USERNAME = value;
	}),
	localforage.getItem("password").then((value) => {
		BEZIAPP_PASSWORD = value;
	}),
	localforage.getItem("lopolis_username").then((value) => {
		BEZIAPP_LOPOLIS_USERNAME = value;
	}),
	localforage.getItem("lopolis_password").then((value) => {
		BEZIAPP_LOPOLIS_PASSWORD = value;
	}),
	localforage.getItem("chosenLang").then((value) => {
		BEZIAPP_LANGUAGE = value;
	}),
	localforage.getItem("theme").then((value) => {
		BEZIAPP_THEME = value;
	}),
	localforage.getItem("errorReporting").then((value) => {
		BEZIAPP_ERRORREPORTING = value;
	})
];

Promise.all(promises_to_run_app).then(() => {

var _paq = window._paq = window._paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(["setDocumentTitle", document.domain + "/" + document.title]);
  _paq.push(["setDoNotTrack", true]);

	if (BEZIAPP_USERNAME == null || BEZIAPP_USERNAME == "") {
	} else {
		_paq.push(['setUserId', BEZIAPP_USERNAME]);
	}
	if (BEZIAPP_LOPOLIS_USERNAME == null || BEZIAPP_LOPOLIS_USERNAME == "") {
	} else {
		_paq.push(['setCustomVariable', 1, 'lopolis-username', BEZIAPP_LOPOLIS_USERNAME, 'visit']);
	}
	if (BEZIAPP_LANGUAGE == null || BEZIAPP_LANGUAGE == "") {
	} else {
		_paq.push(['setCustomVariable', 2, 'language', BEZIAPP_LANGUAGE, 'visit']);
	}
	if (BEZIAPP_THEME == null || BEZIAPP_THEME == "") {
	} else {
		_paq.push(['setCustomVariable', 3, 'theme', BEZIAPP_THEME, 'visit']);
	}
	if (BEZIAPP_ERRORREPORTING == null || BEZIAPP_ERRORREPORTING == "") {
	} else {
		_paq.push(['setCustomVariable', 4, 'errorreporting', BEZIAPP_ERRORREPORTING, 'visit']);
	}
	_paq.push(['enableHeartBeatTimer', 30]);
	_paq.push(['setCustomVariable', 5, 'domain', window.location.host, 'visit']);
  _paq.push(['trackPageView']);
	_paq.push(['trackAllContentImpressions']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="//matomo.gimb.tk/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '1']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();

});

