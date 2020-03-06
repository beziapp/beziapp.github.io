const API_ENDPOINT = "https://gimb.tk/test.php";
// const API_ENDPOINT = "http://localhost:5000/test.php";

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

// Set loading bar visibility
function setLoading(state) {
    if (state) {
        $("#loading-bar").removeClass("hidden");
    } else {
        $("#loading-bar").addClass("hidden");
    }
}

async function loadAbsences(force_refresh = false) {
    setLoading(true);

    // Load required data
    let promises_to_run = [
        localforage.getItem("username").then(function (value) {
            username = value;
        }),
        localforage.getItem("password").then(function (value) {
            password = value;
        }),
        localforage.getItem("absences").then(function (value) {
            absences = value;
        })
    ];

    await Promise.all(promises_to_run);

    // If we don't have a list of absences, query it
    if (absences === null || force_refresh) {
        $.ajax({
            url: API_ENDPOINT,
            crossDomain: true,

            data: {
                "u": username,
                "p": password,
                "m": "fetchizostanki",
                "a": $("#datepicker-from").val(),
                "b": $("#datepicker-to").val()
            },
            dataType: "json",

            cache: false,
            type: "GET",

            success: function (data) {
                // If data is null, the credentials were incorrect
                if (data === null) {
										UIAlert(D("noAbsences"), "loadAbsences(): $.ajax data === null");
                    setLoading(false);
                } else {
                    // Save absences & populate UI
                    localforage.setItem("absences", data).then(function (value) {
                        absences = value;
                        displayData();
                        setLoading(false);
                    });
                }
            },

            error: function () {
								UIAlert(D("noInternetConnection"), "loadAbsences(): $.ajax.error");
                setLoading(false);
            }

        })
    } else {
        displayData();
        setLoading(false);
    }

}

function displayData() {
    absences.forEach(element => {
        let li = document.createElement("li");

        let date_string = element["datum"]["dan"] + ". " + element["datum"]["mesec"] + ". " + element["datum"]["leto"];

        let header = document.createElement("div");
        header.className = "collapsible-header";
        header.innerText = date_string;

        let body = document.createElement("div");
        body.className = "collapsible-body";

        let body_table = document.createElement("table");
        body_table.className = "highlight";
        let body_table_tbody = document.createElement("tbody");

        element["predmeti"].forEach(lesson => {
            let subject_row = document.createElement("tr");

            let subject_lesson_icon = document.createElement("td");

            let subject_lesson_text = document.createElement("td");
            subject_lesson_text.innerText = S("lesson") + " " + lesson["ura"];

            let subject_lesson_icon_i = document.createElement("i");
            subject_lesson_icon_i.className = "material-icons";
            switch (lesson["opraviceno"]["status"]) {
                case 0:
                    subject_lesson_icon_i.innerText = "schedule";
                    break;
                case 1:
                    subject_lesson_icon_i.innerText = "check_circle_outline";
                    break;
                case 2:
                    subject_lesson_icon_i.innerText = "error_outline";
                    break;
                case 3:
                    subject_lesson_icon_i.innerText = "not_interested";
                    break;
            }
            subject_lesson_icon.appendChild(subject_lesson_icon_i);

            let subject_name = document.createElement("td");
            subject_name.innerText = lesson["ime"];

            subject_row.appendChild(subject_lesson_icon);
            subject_row.appendChild(subject_lesson_text);
            subject_row.appendChild(subject_name);
            body_table_tbody.appendChild(subject_row);
        });
        body_table.appendChild(body_table_tbody);
        body.appendChild(body_table);

        li.appendChild(header);
        li.appendChild(body);

        $("#absences-col").append(li);
    });
}

function clearAbsences() {
    const table = document.getElementById("absences-col");
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

function refreshAbsences() {
    clearAbsences();
    loadAbsences(true);
}

function setupPickers() {
    // Setup pickers
    var date_object = new Date();

    let elems = document.querySelectorAll('#datepicker-to');
    let options = {
        autoClose: true,
        format: "dd.mm.yyyy",
        defaultDate: date_object,
        setDefaultDate: true,
        firstDay: 1,
        onSelect: refreshAbsences
    }
    let instances = M.Datepicker.init(elems, options);


    date_object.setDate(date_object.getDate() - 14);

    elems = document.querySelectorAll('#datepicker-from');
    options = {
        autoClose: true,
        format: "dd.mm.yyyy",
        defaultDate: date_object,
        setDefaultDate: true,
        firstDay: 1,
        onSelect: refreshAbsences
    }
    instances = M.Datepicker.init(elems, options);
}

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadAbsences(true);

    // Setup refresh handler
    $("#refresh-icon").click(function () {
        refreshAbsences();
    });

    setupPickers();

    let coll_elem = document.querySelectorAll('.collapsible');
    let coll_instance = M.Collapsible.init(coll_elem, {});

    // Setup side menu
    const menus = document.querySelectorAll('.side-menu');
    M.Sidenav.init(menus, { edge: 'right', draggable: true });

});
