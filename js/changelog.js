async function checkLogin() {
    localforage.getItem("logged_in").then(function (value) {
        // This code runs once the value has been loaded
        // from the offline store.
        if (value !== true) {
            window.location.replace("/index.html");
        }
    }).catch(function (err) {
        // This code runs if there were any errors
        console.log(err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();

    // Setup back button
    $("#nav-back-button").click(function () {
        window.location.replace("/pages/about.html");
    });

    var elems = document.querySelectorAll(".collapsible");
    var instances = M.Collapsible.init(elems, {});
});