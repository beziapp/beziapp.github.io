/**
 * Redirects user to login page if it's not logged int
 */
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

    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });
});
