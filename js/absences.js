// const API_ENDPOINT = "https://gimb.tk/test.php"; // deprecated
// const API_ENDPOINT = "http://localhost:5000/test.php";

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

/**
 * Sets visibility of the loading bar
 * @param {boolean} state Desired visibility
 */
function setLoading(state) {
    if (state) {
        $("#loading-bar").removeClass("hidden");
    } else {
        $("#loading-bar").addClass("hidden");
    }
}

/**
 * Loads absences from API and displays them
 * @param {boolean} forceRefresh If true, cached absences are ignored
 */
async function loadAbsences(forceRefresh = false) {
    setLoading(true);
    // Load required data
    let promisesToRun = [
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
    await Promise.all(promisesToRun);
    // If we don't have a list of absences, query it
    if (absences === null || forceRefresh) {
        try {
            let gsecInstance = new gsec();
            await gsecInstance.login(username, password);
            let date = {};
            date.from = $("#datepicker-from").val().split(".");
            date.till = $("#datepicker-to").val().split(".");
            Object.keys(date).map((key) => {
                date[key] = new Date(Date.parse(date[key].reverse().join("-")));
            });
            gsecInstance.fetchAbsences().then( (fetchedAbsences) => {
                fetchedAbsences.sort((a, b) => {
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(b.date) - new Date(a.date);
                });

                var fromKey = fetchedAbsences.findIndex((procEl) => {
                    if (procEl.date.getTime() >= date.from.getTime()) {
                        return true;
                    }
                });

                var tillKey = fetchedAbsences.findIndex((procEl) => {
                    if (procEl.date.getTime() > date.till.getTime()) {
                        return true;
                    }
                });

                // Both were -1, but we increased fromKey and decreased tillKey
                // Means no absences in the provided timeframe
                if (fromKey === 0 && tillKey === -2) {
                    fetchedAbsences = [];
                } else {
                    fetchedAbsences = fetchedAbsences.slice(fromKey, tillKey);
                }

                absences = fetchedAbsences;
                localforage.setItem("absences", fetchedAbsences).then(() => {
                    displayData();
                    setLoading(false);
                });
                setLoading(false);
            }).catch( (err) => {
                gsecErrorHandlerUI(err);
                setLoading(false);
            });
        } catch (err) {
            gsecErrorHandlerUI(err);
            setLoading(false);
        }
    } else {
        displayData();
        setLoading(false);
    }
}

/**
 * Display absences data - called by loadAbsences
 */
function displayData() {
    absences.forEach(absence => {
        let li = document.createElement("li");

        // dateString comes from bundle.js
        let dateStringValue = dateString.longFormatted(absence["date"]);

        let header = document.createElement("div");
        header.className = "collapsible-header";
        header.innerText = dateStringValue;

        let body = document.createElement("div");
        body.className = "collapsible-body";

        let body_table = document.createElement("table");
        body_table.className = "highlight";

        let body_table_tbody = document.createElement("tbody");

        Object.keys(absence.subjects).forEach(lesson => {

            let absenceLessonObject = absence["subjects"][lesson];

            let subjectRow = document.createElement("tr");
            let subjectLessonIcon = document.createElement("td");
            let subjectLessonText = document.createElement("td");
            subjectLessonText.innerText = `${S("lesson")} ${lesson}`;

            let subjectLessonIconInner = document.createElement("i");
            subjectLessonIconInner.className = "material-icons";

            switch (absenceLessonObject["status"]) {
                case 0:
                    subjectLessonIconInner.innerText = "schedule";
                    break;
                case 1:
                    subjectLessonIconInner.innerText = "check_circle_outline";
                    break;
                case 2:
                    subjectLessonIconInner.innerText = "error_outline";
                    break;
                case 3:
                    subjectLessonIconInner.innerText = "not_interested";
                    break;
            }

            subjectLessonIcon.appendChild(subjectLessonIconInner);

            let subjectName = document.createElement("td");
            subjectName.innerText = `${S(gseAbsenceTypes[absenceLessonObject["status"]])} : ${absenceLessonObject["subject"]}`;
            subjectRow.appendChild(subjectLessonIcon);
            subjectRow.appendChild(subjectLessonText);
            subjectRow.appendChild(subjectName);
            body_table_tbody.appendChild(subjectRow);
        });

        body_table.appendChild(body_table_tbody);
        body.appendChild(body_table);

        li.appendChild(header);
        li.appendChild(body);
        $("#absences-col").append(li);
    });
}

/**
 * Clear all displayed absences
 */
function clearAbsences() {
    const table = document.getElementById("absences-col");
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

/**
 * Force reloading of absences
 */
function refreshAbsences() {
    clearAbsences();
    loadAbsences(true);
}

/**
 * Setup date pickers (from date and to date)
 */
function setupPickers() {
    // Setup pickers
    var dateObject = new Date();

    let elems = document.querySelectorAll('#datepicker-to');
    let options = {
        autoClose: true,
        format: "dd.mm.yyyy",
        defaultDate: dateObject,
        setDefaultDate: true,
        firstDay: 1,
        onSelect: refreshAbsences
    }

    M.Datepicker.init(elems, options);

    dateObject.setDate(dateObject.getDate() - 14);

    elems = document.querySelectorAll('#datepicker-from');
    options = {
        autoClose: true,
        format: "dd.mm.yyyy",
        defaultDate: dateObject,
        setDefaultDate: true,
        firstDay: 1,
        onSelect: refreshAbsences
    }
    M.Datepicker.init(elems, options);
}

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadAbsences(true);

    // Setup refresh handler
    $("#refresh-icon").click(function () {
        refreshAbsences();
    });

    setupPickers();

    let collectionElem = document.querySelectorAll('.collapsible');
    M.Collapsible.init(collectionElem, {});

    // Setup side menu
    const menus = document.querySelectorAll('.side-menu');
    M.Sidenav.init(menus, { edge: 'right', draggable: true });
});
