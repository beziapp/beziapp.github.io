const API_ENDPOINT = "https://gimb.tk/test.php";
// const API_ENDPOINT = "http://localhost:5000/test.php";

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
})

function setupEventListeners() {
    // Setup login button listener
    $("#login-button").click(function () {
        login();
    });
}

// Handle login button click
function login() {
    // Get text input values
    let username = $("#username").val();
    let password = $("#password").val();

    // Make a request
    $.ajax({
        url: API_ENDPOINT,
        crossDomain: true,

        data: {
            "u": username,
            "p": password,
            "m": "fetchprofil"
        },
        dataType: "json",

        cache: false,
        type: "GET",

        success: function (data) {

            // If ime is null, the password was incorrect
            if (data["ime"] === null) {
                M.toast({ html: "Login failed!" });
                $("#password").val("");
            } else {

                let promises_to_run = [
                    localforage.setItem("logged_in", true),
                    localforage.setItem("username", username),
                    localforage.setItem("password", password)
                ];
                Promise.all(promises_to_run).then(function () {
                    window.location.replace("/pages/timetable.html");
                });

            }
        },

        error: function () {
            M.toast({ html: "No internet connection!" });
        }

    })
}