



const app_version = "1.0.13-beta";
const previous_commit = "db70845685ffe5fa725530ca03ba4c72e822e450";

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
        M.toast( { html: usermsg } );
        console.log(`[BežiApp UIAlert] ${usermsg} ${devmsg}`);
    } else {
        M.toast( { html: `${usermsg} ${devmsg}` } );
    }
}

/**
 * Handles GSEC error - notifies the user and prints a console message
 * @param {Object} err GSEC error object
 */
function gsecErrorHandlerUI(err) {
    console.log(`gsecErrorHanderUI: handling ${err}`);
    if(err == GSEC_ERR_NET || err == GSEC_ERR_NET_POSTBACK_GET ||
        err == GSEC_ERR_NET_POSTBACK_POST) {

        UIAlert( D("gsecErrNet") );
    } else if(err == GSEC_ERR_LOGIN) {
        UIAlert( D("gsecErrLogin") );
        localforage.setItem("logged_in", false).then( () => {
        window.location.replace("/index.html");
        });
    } else {
        UIAlert( D("gsecErrOther") );
    }
}


var error_report_function = async function (msg, url, lineNo, columnNo, error) {
	localforage.getItem("errorReporting").then((value) => {
		let selectedE = value;
		if(value == null || value.length < 1) {
			selectedE = "on";
		}
		if(selectedE == "on") {
			var data = {};
			data.error = {"msg": msg, "url": url, "line": lineNo, "column": columnNo, "obj": error};
			data.client = {"ua": navigator.userAgent, "app_version": app_version, "previous_commit": previous_commit};
			data.type = "error";
			$.post("https://beziapp-report.gimb.tk/", data);
		} else {
			console.log("error not reported as reporting is disabled!");
		}
	}).catch(() => {});
	return false;
}

window.onerror = error_report_function;
window.onunhandledrejection = error_report_function;
