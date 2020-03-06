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
if (location.protocol != 'https:') {
 location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}
async function UIAlert(usermsg, devmsg) {
  if(true) { // če bo kakšen dev switch?
    M.toast( { html: usermsg } );
    console.log("[BežiApp UIAlert] "+usermsg+" "+devmsg);
  } else {
    M.toast( { html: usermsg+" "+devmsg } );
  }
}

