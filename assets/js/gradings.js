// const API_ENDPOINT = "https://gimb.tk/test.php"; // deprecated
var calendar_obj = null;
var gradings;
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

// GET COLOR FROM STRING
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

function getDateString() {
    let date = new Date();

    let year_str = date.getFullYear();
    let month_str = date.getMonth() + 1
    month_str = month_str.toString().padStart(2, "0");
    let day_str = date.getDate();
    day_str = day_str.toString().padStart(2, "0");

    let date_string = year_str + "-" + month_str + "-" + day_str;
    return date_string;
}

async function loadGradings(force_refresh = false) {
    setLoading(true);
    let promises_to_run = [
        localforage.getItem("username").then((value) => {
            username = value;
        }),
        localforage.getItem("password").then((value) => {
            password = value;
        }),
        localforage.getItem("gradings").then((value) => {
            gradings = value;
        })
    ];
    await Promise.all(promises_to_run);
    if (gradings == null || gradings == [] || gradings == -1 || force_refresh) {
        try {
            let gsecInstance = new gsec();
            await gsecInstance.login(username, password);
            gsecInstance.fetchGradings().then( (value) => {
                gradings = value;
                localforage.setItem("gradings", value).then(() => {
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
    let transformed_gradings = [];
    gradings.forEach((element, index) => {
        let bg_color = getHexColorFromString(element["acronym"]);
        let fg_color = getForegroundFromBackground(bg_color);
        let grading_object = {
            start: element["date"].toISOString().substring(0, 10), // če se da direktno date object, se doda še 1a zraven (prefixa tajtlu) (verjetno 1am ura)
            title: element["acronym"],
            id: index.toString(),
            backgroundColor: bg_color,
            textColor: fg_color
        };
        transformed_gradings.push(grading_object);
    });
    calendar_obj.removeAllEvents();
    calendar_obj.addEventSource(transformed_gradings);
}

function gradingClickHandler(eventClickInfo) {
    let grading_id = parseInt(eventClickInfo.event.id);
    let grading_subject = gradings[grading_id]["subject"];
    let grading_date_obj = gradings[grading_id]["date"];
    let grading_date = dateString.longFormatted(grading_date_obj);
    let grading_description = gradings[grading_id]["description"];
    $("#grading-subject").text(grading_subject);
    $("#grading-date").text(grading_date);
    $("#grading-description").text(grading_description);
    const modal = document.querySelectorAll(".side-modal")[0];
    M.Sidenav.getInstance(modal).open();
}

    function setupPickers() {
        // Setup pickers, todo (adding an event), to be stored in messages
        var date_object = new Date();
        let elems = document.querySelectorAll('#datepicker-add');
        let options = {
            autoClose: true,
            format: "dd.mm.yyyy",
            defaultDate: date_object,
            setDefaultDate: true,
            firstDay: 1
        }
        instances = M.Datepicker.init(elems, options);
    }


document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    // Calendar setup
    var calendarEl = document.getElementById("calendar");
    calendar_obj = new FullCalendar.Calendar(calendarEl, {
        firstDay: 1,
        plugins: ["dayGrid"],
        defaultDate: getDateString(),
        navLinks: false,
        editable: false,
        events: [],
        eventClick: gradingClickHandler,
        height: "parent"
    });
    calendar_obj.render();

    // Modal for adding gradings
    // setupPickers(); // todo (adding an event), to be stored in messages
    // // Setup modals
	// const modal_elems = document.querySelectorAll('.modal');
	// const modal_options = {
	// 	onOpenStart: () => { $("#fab-new").hide() },
	// 	onCloseEnd: () => { $("#fab-new").show() },
	// 	dismissible: false
	// };
	// M.Modal.init(modal_elems, modal_options);

    loadGradings(true);
    // Setup refresh handler
    $("#refresh-icon").click(() => {
        loadGradings(true);
    });
    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });
    // Setup side modal
    const modals = document.querySelectorAll('.side-modal');
    M.Sidenav.init(modals, { edge: 'left', draggable: false });
});
