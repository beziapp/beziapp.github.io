const API_ENDPOINT = "https://gimb.tk/test.php";
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
})

function setupEventListeners() {
    // Setup login button listener
    $("#login-button").click(() => {
        login();
    });

    window.addEventListener("keyup", (event) => {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            login();
        }
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
								UIAlert( S("loginFailed"), "login(): fetchprofil null name; bad login info." );
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
					UIAlert( S("noInternetConnection"), "login(): $.ajax error" );
        }

    })
}
