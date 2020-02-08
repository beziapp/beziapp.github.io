function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};
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
        localforage.setItem("messages", {})
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
                setupStorage();
            } else if (value === false) {
                window.location.replace("/login.html");
            } else {
		if(getUrlParameter("m")) {
			window.location.replace("pages/messaging.html?"+getUrlParameter("m"));
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
