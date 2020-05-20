// const API_ENDPOINT = "https://gimb.tk/test.php"; // deprecated
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
    let username = $("#username").val();
    let password = $("#password").val();
		var gsecInstance;
		try {
    	gsecInstance = new gsec();
		} catch (error) {
			$.getScript("/js/gsec.js");
			try {
	    	gsecInstance = new gsec();
			} catch (error) {
				alert(D("browserNotSupported"));
			}
		}
    gsecInstance.login(username, password).then( (value) => {
        if (typeof value == "string") {
            let promises_to_run = [
                localforage.setItem("logged_in", true),
                localforage.setItem("username", username),
                localforage.setItem("password", password)
            ];
            Promise.all(promises_to_run).then(function () {
                window.location.replace("/pages/timetable.html");
            });
        } else {
            UIAlert("loginFailed");
            $("#password").val("");
        }
    }).catch((err) => {
        gsecErrorHandlerUI(err);
        $("#password").val("");
    });
}
