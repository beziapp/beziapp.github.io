// navigator.serviceWorker.controller.postMessage(JSON.stringify({action: "deletecaches"})); // cache only sets on initialization, so it should not be deleted.
// since sw.js is not cached, updates work.
localforage.clear().then(() => { // deletes localforage
    window.location.replace("/index.html");
});
