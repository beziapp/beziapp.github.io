// const API_ENDPOINT = "https://gimb.tk/test.php"; // deprecated
// const API_ENDPOINT = "http://localhost:5000/test.php";

var calendar_obj = null;
var transformed_storage = [];
function checkLogin() {
    localforage.getItem("logged_in").then((value) => {
        // This code runs once the value has been loaded
        // from the offline store.
        if (value != true) {
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

// ----GET COLOR FROM STRING--------

function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i) {
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}

// http://www.w3.org/TR/AERT#color-contrast
function getForegroundFromBackground(background_color) {
    let color_hex = background_color.replace("#", "");
    let rgb = [
        parseInt(color_hex.substring(0, 2), 16),
        parseInt(color_hex.substring(2, 4), 16),
        parseInt(color_hex.substring(4, 6), 16)
    ];
    let o = Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000);
    if (o > 180) {
        return "#000000";
    } else {
        return "#ffffff";
    }
}

function getHexColorFromString(str) {
    return "#" + intToRGB(hashCode(str));
}
// --------------------------------------------------

// ---------DATE FUNCTION-------------
function getDateString(date) {

    let year_str = date.getFullYear();
    let month_str = date.getMonth() + 1
    month_str = month_str.toString().padStart(2, "0");
    let day_str = date.getDate();
    day_str = day_str.toString().padStart(2, "0");

    let date_string = year_str + "-" + month_str + "-" + day_str;
    return date_string;
}

function getLastMonday(date_object) {
    if (date_object.getDay() === 0) {
        date_object.setDate(date_object.getDate() - 6);
    } else {
        date_object.setDate(date_object.getDate() - date_object.getDay() + 1);
    }
    return date_object;
}
// ----------------------------------

async function loadTimetable(date_object, force_refresh = false) {
	setLoading(true);
	var timetable, username, password;
	let date_monday = getLastMonday(date_object);
	let date_string = getDateString(date_monday);
	let promises_to_run = [
		localforage.getItem("username").then(function (value) {
			username = value;
		}),
		localforage.getItem("password").then(function (value) {
			password = value;
		}),
		localforage.getItem("timetable").then(function (value) {
			timetable = value;
		})
	];
	await Promise.all(promises_to_run);
	if (force_refresh || timetable == null || !(date_string in timetable)) {
		try {
			let gsecInstance = new gsec();
			await	gsecInstance.login(username, password);
			gsecInstance.fetchTimetable(date_object).then( (value) => {
				containsPeriods = false;
				for(var iteration = 0; iteration <= 6; iteration++) {
					if(Object.keys(value[iteration]).length > 0) {
						containsPeriods = true;
						// break;
					}
				}
				if(!containsPeriods) {
					UIAlert( D("noPeriods") );
					setLoading(false);
				} else {
					if (timetable === null) {
						timetable = {};
					}
					timetable[date_string] = value;
					localforage.setItem("timetable", timetable).then(() => {
						displayTimetable(value, date_monday);
						setLoading(false);
					});
				}
			}).catch( (err) => {
				gsecErrorHandlerUI(err);
				setLoading(false);
			});
		} catch (err) {
			gsecErrorHandlerUI(err);
			setLoading(false);
		}
	} else {
		displayTimetable(timetable[date_string], date_monday);
		setLoading(false);
	}
}

function getLessonTimes(lesson_number) {
    const lessonTimes = [
        ["07:10:00", "07:55:00"],
        ["08:00:00", "08:45:00"],
        ["08:50:00", "09:35:00"],
        ["09:40:00", "10:25:00"],
        ["10:55:00", "11:40:00"],
        ["11:45:00", "12:30:00"],
        ["12:35:00", "13:20:00"],
        ["13:25:00", "14:10:00"],
        ["14:15:00", "15:00:00"],
        ["15:05:00", "15:50:00"],
        ["15:55:00", "16:40:00"],
        ["16:45:00", "17:30:00"],
        ["17:35:00", "18:20:00"],
        ["18:25:00", "19:10:00"]
    ];
    return lessonTimes[lesson_number];
}

function displayTimetable(weekly_timetable, date_object) {
    let transformed_timetable = [];

    let num_days = Object.keys(weekly_timetable).length;

    for (let i = 0; i < num_days; i++) {

        // Get date string (required by callendar)
        let date_string = getDateString(date_object);
        // Go to next day (for next loop iteration)
        date_object.setDate(date_object.getDate() + 1);

        let daily_timetable = weekly_timetable[i.toString()];

        Object.keys(daily_timetable).forEach((lesson_number) => {
            let lesson = daily_timetable[lesson_number];

            let lesson_times = getLessonTimes(parseInt(lesson_number));
            let bg_color = getHexColorFromString(lesson["acronym"]);
            let fg_color = getForegroundFromBackground(bg_color);

            let lesson_metadata = {
                subject: lesson["subject"],
                class: lesson["class"],
                teacher: lesson["teacher"],
                classroom: lesson["place"],
                start: lesson_times[0].substring(0, 5),
                end: lesson_times[1].substring(0, 5)
            }

            let lesson_object = {
                id: JSON.stringify(lesson_metadata),
                title: lesson["acronym"],
                start: date_string + " " + lesson_times[0],
                end: date_string + " " + lesson_times[1],
                backgroundColor: bg_color,
                textColor: fg_color
            };

            transformed_timetable.push(lesson_object);

        });

    }
    // Update calendar
    calendar_obj.removeAllEvents();
    calendar_obj.addEventSource(transformed_timetable);

    // Update stored value
    transformed_storage = transformed_timetable;
}

function eventClickHandler(eventClickInfo) {
    let lesson_metadata = JSON.parse(eventClickInfo.event.id);

    let lesson_subject = lesson_metadata["subject"];
    let lesson_teacher = lesson_metadata["teacher"];
    let lesson_classroom = lesson_metadata["classroom"];
    let lesson_class = lesson_metadata["class"];
    let lesson_duration = lesson_metadata["start"] + " - " + lesson_metadata["end"];

    $("#lesson-subject").text(lesson_subject);
    $("#lesson-teacher").text(lesson_teacher);
    $("#lesson-class").text(lesson_class);
    $("#lesson-classroom").text(lesson_classroom);
    $("#lesson-duration").text(lesson_duration);

    const modal = document.querySelectorAll(".side-modal")[0];
    M.Sidenav.getInstance(modal).open();
}


document.addEventListener("DOMContentLoaded", () => {
    checkLogin();

    let calendarEl = document.getElementById("calendar");
    calendar_obj = new FullCalendar.Calendar(calendarEl, {
        plugins: ["timeGrid"],
        eventClick: eventClickHandler,

        defaultView: "timeGridWeek",
        contentHeight: "auto",
        height: "auto",
        width: "auto",
        timeGridEventMinHeight: 35,

        nowIndicator: true,
        firstDay: 1,
        weekends: false,

        minTime: "07:10:00",
        maxTime: "19:10:00"
    });
    calendar_obj.render();

    loadTimetable(new Date());

    // Handlers for next/prev/today buttons
    $(".fc-today-button, .fc-prev-button, .fc-next-button").click(() => {
        loadTimetable(calendar_obj.getDate());
    });

    // Setup refresh handler
    $("#refresh-icon").click(() => {
        loadTimetable(calendar_obj.getDate(), true);
    });

    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });

    // Setup side modal
    const modals = document.querySelectorAll('.side-modal');
    M.Sidenav.init(modals, { edge: 'left', draggable: false });
});
