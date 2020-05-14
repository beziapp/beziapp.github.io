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

async function UIAlert(usermsg, devmsg) {
  if(true) { // če bo kakšen dev switch?
    M.toast( { html: usermsg } );
    console.log(`[BežiApp UIAlert] ${usermsg} ${devmsg}`);
  } else {
    M.toast( { html: `${usermsg} ${devmsg}` } );
  }
}

function gsecErrorHandlerUI(err) {
	console.log(`gsecErrorHanderUI: handling ${err}`);
  if(err == GSEC_ERR_NET || err == GSEC_ERR_NET_POSTBACK_GET || err == GSEC_ERR_NET_POSTBACK_POST) {
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
