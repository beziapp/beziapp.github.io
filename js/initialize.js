function getUrlParameter(sParam) {
    const url_params = new URLSearchParams(window.location.search);
    const found_param = url_params.get(sParam);
    return found_param === null ? "" : found_param;
}


localforage.getItem("logged_in")
    .then(
        function (value) {
            // This code runs once the value has been loaded
            // from the offline store.
            if (value == null) {
                // Setup the storage if it doesn't exist
                setupStorage(true);
                window.location.replace("/login.html");
            } else if (value === false) {
                // If storage exists, but user isn't logged in, redirect to login
                window.location.replace("/login.html");
            } else {
                // User is logged in, execute appropriate action

                if (getUrlParameter("m") !== "") {
                    window.location.replace("/pages/messaging.html#" + getUrlParameter("m"));
                } else {
                    window.location.replace("/pages/timetable.html");
                }

            }
        }
    ).catch(
        function (err) {
            console.log(err);
        }
    );
