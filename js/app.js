if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
        .then(() => console.log("Service worker registered"))
        .catch((err) => console.log("Service worker registration failed", err));
}