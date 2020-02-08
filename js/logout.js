navigator.serviceWorker.controller.postMessage(JSON.stringify({action: "deletecaches"})); // deletes cache
localforage.clear().then(() => { // deletes localforage
    window.location.replace("/index.html");
});
