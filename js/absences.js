// const API_ENDPOINT = "https://gimb.tk/test.php"; // deprecated
// const API_ENDPOINT = "http://localhost:5000/test.php";
var absences;
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
		try {
			let gsecInstance = new gsec();
			await	gsecInstance.login(username, password);
			let date = {};
			date.from = $("#datepicker-from").val().split(".");
			date.till = $("#datepicker-to").val().split(".");
			Object.keys(date).map((key, index) => {
				date[key] = new Date(Date.parse(date[key].reverse().join("-")));
			});
			gsecInstance.fetchAbsences().then( (value) => {
				value.sort(function(a,b){
					// Turn your strings into dates, and then subtract them
					// to get a value that is either negative, positive, or zero.
					return new Date(b.date) - new Date(a.date);
				});
				var fromKey = value.findIndex((processedElement, processedIndex) => {
					if(processedElement.date.getTime() >= date.from.getTime()) {
						return true;
					}
				});
				var tillKey = value.reverse().findIndex((pE, pI) => {
					if(pE.date.getTime() <= date.till.getTime()) {
						return true;
					}
				});
				value.length = tillKey+1; // tillKey in
				value.splice(0, fromKey); // fromKey hočemo obdržati
                if(tillKey == 0 && fromKey == -1) {
                    // očitno je karantena in ni nobenih izostnakov
                    value.length = 0;
                }
				absences = value;
				localforage.setItem("absences", value).then((value) => {
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

function displayData() {
	absences.forEach(absence => {
		let li = document.createElement("li");

		let date_string = dateString.longFormatted(absence["date"]); // javascript sucks - zakaj ob vsej svoji "preprostosti" ne morm met Date za key objecta!?!?'!!11~
		let header = document.createElement("div");
		header.className = "collapsible-header";
		header.innerText = date_string;

		let body = document.createElement("div");
		body.className = "collapsible-body";

		let body_table = document.createElement("table");
		body_table.className = "highlight";

		let body_table_tbody = document.createElement("tbody");

		Object.keys(absence.subjects).forEach(lesson => {
			let subject_row = document.createElement("tr");
			let subject_lesson_icon = document.createElement("td");
			let subject_lesson_text = document.createElement("td");
			subject_lesson_text.innerText = S("lesson") + " " + lesson;

			let subject_lesson_icon_i = document.createElement("i");
			subject_lesson_icon_i.className = "material-icons";

			switch (absence["subjects"][lesson]["status"]) {
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
			subject_name.innerText = S(gseAbsenceTypes[absence["subjects"][lesson]["status"]]) + " : " + absence["subjects"][lesson]["subject"];
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
