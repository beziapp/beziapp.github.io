const API_ENDPOINT = "https://gimb.tk/test.php";
// const API_ENDPOINT = "http://localhost:5000/test.php";

var teachers = null;

// Set loading bar visibility
function setLoading(state) {
    if (state) {
        $("#loading-bar").removeClass("hidden");
    } else {
        $("#loading-bar").addClass("hidden");
    }
}

// Function, responsible for fetching and displaying data
async function loadTeachers(force_refresh = false) {
    setLoading(true);

    // Load required data
    let promises_to_run = [
        localforage.getItem("username").then((value) => {
            username = value;
        }),
        localforage.getItem("password").then((value) => {
            password = value;
        }),
        localforage.getItem("teachers").then((value) => {
            teachers = value;
        })
    ];

    Promise.all(promises_to_run).then(() => {

        // If we don't have a list of teachers, query it
        if (teachers === null || force_refresh) {
            $.ajax({
                url: API_ENDPOINT,
                crossDomain: true,

                data: {
                    "u": username,
                    "p": password,
                    "m": "fetchprofesorji"
                },
                dataType: "json",

                cache: false,
                type: "GET",

                success: (data) => {
                    // If data is null, the request failed
                    if (data === null) {
												UIAlert(D("requestFailed"));
                        setLoading(false);
                    } else {
                        // Save teachers & populate table
                        localforage.setItem("teachers", data).then((value) => {
                            teachers = value;
                            displayData();
                            setLoading(false);
                        });
                    }
                },

                error: () => {
										UIAlert(D("noInternetConnection"));
                    setLoading(false);
                }

            })
        } else {
            displayData();
            setLoading(false);
        }
    });
}

// Function for displaying data
function displayData() {

    teachers.forEach(element => {
        // Create row
        let row = document.createElement("tr");
        // Create cell 1
        let cell_name = document.createElement("td");
        let cell_name_text = document.createTextNode(element["ime"]);
        // Create cell 2
        let cell_subject = document.createElement("td");
        // Array ([0]) is useless, since every teacher is duplicated (for each subject)
        let cell_subject_text = document.createTextNode(element["predmeti"][0]["ime"]);

        cell_name.appendChild(cell_name_text);
        row.appendChild(cell_name);

        cell_subject.appendChild(cell_subject_text);
        row.appendChild(cell_subject);

        $("#teachers-body").append(row);
    });
    // Refresh handlers
    refreshTableClickHandlers();
}

async function checkLogin() {
    localforage.getItem("logged_in").then((value) => {
        // This code runs once the value has been loaded
        // from the offline store.
        if (value !== true) {
            window.location.replace("/index.html");
        }
    }).catch((err) => {
        // This code runs if there were any errors
        console.log(err);
    });
}

function clearTable() {
    const table = document.getElementById("teachers-body");
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

function refreshTableClickHandlers() {
    // Arrow function doesn't work apparently?
    $('#teachers-body').find("tr").click(function () {
        teacherInfo($(this).index());
    });
}

function teacherInfo(teacher_id) {
    let teacher_object = teachers[teacher_id];

    let name = teacher_object["ime"];
    let subject = teacher_object["predmeti"][0]["ime"];
    let office_day = dateString.day(teacher_object["govorilneure"]["dan"]);
    let office_lesson = teacher_object["govorilneure"]["solskaura"];

    document.getElementById("teacher-name").innerText = name;
    document.getElementById("teacher-subject").innerText = S("schoolSubject") + ": " + subject;

    document.getElementById("teacher-office").innerText = office_day + ", " + S("lesson") + " " + office_lesson;

    const modal = document.querySelectorAll('.side-modal')[0];
    M.Sidenav.getInstance(modal).open();
}

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadTeachers();

    // Setup refresh handler
    $("#refresh-icon").click(() => {
        clearTable();
        loadTeachers(true);
    });

    // Set row onClick functions
    refreshTableClickHandlers();

    // Setup side menu
    const menus = document.querySelectorAll('.side-menu');
    M.Sidenav.init(menus, { edge: 'right', draggable: true });

    // Setup side modal
    const modals = document.querySelectorAll('.side-modal');
    M.Sidenav.init(modals, { edge: 'left', draggable: false });
});
