if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
        .then(() => {})
        .catch((err) => console.log("Service worker registration failed", err));
}