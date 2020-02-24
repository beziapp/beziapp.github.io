function getUrlParameter(sParam) {
    const url_params = new URLSearchParams(window.location.search);
    const found_param = url_params.get(sParam);
    if (found_param === null) {
        return ""
    } else {
        return found_param
    }
}

function setupStorage() {
    promises_to_run = [
        localforage.setItem("logged_in", false),
        localforage.setItem("username", ""),
        localforage.setItem("password", ""),
        localforage.setItem("profile", {}),
        localforage.setItem("timetable", []),
        localforage.setItem("teachers", []),
        localforage.setItem("gradings", []),
        localforage.setItem("grades", []),
        localforage.setItem("absences", {}),
        localforage.setItem("messages", {}),
        localforage.setItem("directory", {}),
        localforage.setItem("meals", {})
    ];

    Promise.all(promises_to_run)
        .then(
            window.location.replace("/login.html")
        );
}

localforage.getItem("logged_in")
    .then(
        function (value) {
            // This code runs once the value has been loaded
            // from the offline store.
            if (value === null) {
                // Setup the storage if it doesn't exist
                setupStorage();
            } else if (value === false) {
                // If storage exists, but user isn't logged in, redirect to login
                window.location.replace("/login.html");
            } else {
                // User is logged in, execute appropriate action

                if (getUrlParameter("m") !== "") {
                    window.location.replace("/pages/messaging.html?m=" + getUrlParameter("m"));
                } else {
                    window.location.replace("/pages/timetable.html");
                }

            }
        }
    ).catch(
        function (err) {
            // This code runs if there were any errors
            console.log(err);
        }
    );
