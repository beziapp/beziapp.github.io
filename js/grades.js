const API_ENDPOINT = "https://gimb.tk/test.php";
// const API_ENDPOINT = "http://localhost:5000/test.php";

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

// Set loading bar visibility
function setLoading(state) {
    if (state) {
        $("#loading-bar").removeClass("hidden");
    } else {
        $("#loading-bar").addClass("hidden");
    }
}

async function loadGrades(force_refresh = false) {
    setLoading(true);

    let promises_to_run = [
        localforage.getItem("username").then((value) => {
            username = value;
        }),
        localforage.getItem("password").then((value) => {
            password = value;
        }),
        localforage.getItem("grades").then((value) => {
            grades = value;
        })
    ];

    await Promise.all(promises_to_run);

    // If we don't have a list of grades, fetch it
    if (grades === null || grades === [] || force_refresh) {

        $.ajax({
            url: API_ENDPOINT,
            crossDomain: true,

            data: {
                "u": username,
                "p": password,
                "m": "fetchocene"
            },
            dataType: "json",

            cache: false,
            type: "GET",

            success: (data) => {
                // If data is null, the request failed
                if (data === null) {
                    M.toast({ html: "Request failed!" });
                    setLoading(false);
                } else {
                    // Save grades & populate view
                    localforage.setItem("grades", data).then((value) => {
                        grades = value;
                        displayGrades();
                        setLoading(false);
                    });
                }
            },

            error: () => {
                M.toast({ html: "No internet connection!" });
                setLoading(false);
            }

        });

    } else {
        displayGrades();
        setLoading(false);
    }
}

function displayGrades() {
    let grades_by_subject = {};
    grades.forEach((grade, index) => {
        if (!(grade["predmet"] in grades_by_subject)) {
            grades_by_subject[grade["predmet"]] = [];
        }
        let grade_object = {
            date: grade["datum"],
            teacher: grade["profesor"],
            subject: grade["predmet"],
            title: grade["naslov"],
            type: grade["vrsta"],
            term: grade["rok"],
            grade: grade["ocena"],
            temporary: grade["zacasna"],
            index: index
        }
        grades_by_subject[grade["predmet"]].push(grade_object);
    });

    let root_element = document.getElementById("grades-collapsible");

    Object.keys(grades_by_subject).forEach((subject) => {
        // Create root element for a subject entry
        let subject_entry = document.createElement("li");
        // Create subject collapsible header
        let subject_header = document.createElement("div");
        subject_header.classList.add("collapsible-header");
        subject_header.classList.add("collapsible-header-root");
        // Create header text element
        let subject_header_text = document.createElement("span");
        subject_header_text.innerText = subject;

        // Create collection for displaying individuals grades
        let subject_body = document.createElement("div");
        subject_body.className = "collapsible-body";
        let subject_body_root = document.createElement("ul");
        subject_body_root.className = "collection";

        // Setup variables for calculating average
        let grade_sum = 0;
        let grade_tot = 0;

        grades_by_subject[subject].forEach((grade) => {
            // Create element for individual grade
            let grade_node = document.createElement("li");
            grade_node.className = "collection-item";
            grade_node.classList.add("collection-item")
            grade_node.classList.add("grade-node");
            grade_node.dataset["index"] = grade["index"];
            let grade_node_div = document.createElement("div");

            // Node for date and subject text
            let grade_text = document.createElement("span");
            // Node for the actual number
            let grade_number = document.createElement("div");
            grade_number.className = "secondary-content";

            // Apply different style, if the grade is temporary
            if (grade["temporary"]) {
                // Styling for text
                let grade_text_italic = document.createElement("i");
                grade_text_italic.innerText = grade["date"] + " - " + grade["title"];
                grade_text.appendChild(grade_text_italic);

                // Styling for number
                let grade_number_italic = document.createElement("i");
                grade_number_italic.innerText = grade["grade"].toString();
                grade_number.appendChild(grade_number_italic);
            } else {
                // Text
                grade_text.innerText = grade["date"] + " - " + grade["title"];
                // Number
                grade_number.innerText = grade["grade"].toString();
            }

            grade_node_div.appendChild(grade_text);
            grade_node_div.appendChild(grade_number);

            grade_node.appendChild(grade_node_div);


            // Count the grade only if it's not temprary
            if (!grade["temporary"]) {
                grade_sum += grade["grade"];
                grade_tot += 1;
            }

            subject_body_root.appendChild(grade_node);

        });

        let grade_average = (grade_tot === 0) ? "N/A" : (Math.round(((grade_sum / grade_tot) + Number.EPSILON) * 100) / 100);
        let subject_header_average = document.createElement("div");
        subject_header_average.className = "collapsible-header-right";
        subject_header_average.innerText = grade_average.toString();

        subject_header.appendChild(subject_header_text);
        subject_header.appendChild(subject_header_average);

        subject_body.append(subject_body_root);

        subject_entry.append(subject_header);
        subject_entry.append(subject_body);

        root_element.append(subject_entry);
    });

    $("#grades-collapsible").append(root_element);

    refreshClickHandlers();
}

function clearGrades() {
    const table = document.getElementById("grades-collapsible");
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

function refreshGrades() {
    clearGrades();
    loadGrades(true);
}

function refreshClickHandlers() {
    $("#grades-collapsible").find(".collection-item.grade-node").click(function () {
        let grade_obj = grades[parseInt(this.dataset["index"])];
        document.getElementById("grade-header").innerText = grade_obj["predmet"] + ": " + grade_obj["ocena"];
        document.getElementById("grade-date").innerText = grade_obj["datum"];
        document.getElementById("grade-title").innerText = grade_obj["naslov"];
        document.getElementById("grade-type").innerText = "Type: " + grade_obj["vrsta"];

        let term_element = document.getElementById("grade-term");
        if (grade_obj["rok"] !== "") {
            term_element.innerText = "Term: " + grade_obj["rok"];
            term_element.style["display"] = "";
        } else {
            term_element.style["display"] = "none";
        }

        document.getElementById("grade-teacher").innerText = "Teacher: " + grade_obj["profesor"];

        let temporary_object = document.getElementById("grade-temporary");
        let temporary_object_root = document.getElementById("grade-temporary-root");
        if (grade_obj["zacasna"]) {
            temporary_object.innerText = "(zacasna)";
            temporary_object_root.style["display"] = "";
        } else {
            temporary_object_root.style["display"] = "none";
        }

        const modal = document.querySelectorAll('.side-modal')[0];
        M.Sidenav.getInstance(modal).open();
    });
}

// Initialization code
document.addEventListener("DOMContentLoaded", async () => {
    checkLogin();
    await loadGrades();

    let coll_elem = document.querySelectorAll('.collapsible');
    let coll_instance = M.Collapsible.init(coll_elem, {});

    // Setup refresh handler
    $("#refresh-icon").click(function () {
        refreshGrades();
    });

    // Setup side menu
    const menus = document.querySelectorAll('.side-menu');
    M.Sidenav.init(menus, { edge: 'right', draggable: true });

    // Setup side modal
    const modals = document.querySelectorAll('.side-modal');
    M.Sidenav.init(modals, { edge: 'left', draggable: false });
});