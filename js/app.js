if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
        .then(() => { })
        .catch((err) => console.log("Service worker registration failed", err));
}

// Listen to messages from service workers.
if(navigator.serviceWorker)(
navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.msg === "install") {
        window.location.replace("/index.html");
    }
});
)
