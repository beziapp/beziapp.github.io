const API_ENDPOINT = "https://lopolis-api.gimb.tk/";

var meals_calendar_obj = null;
var meals_data_global = {};

function getDateString() { // ne mene gledat, ne vem, kaj je to.
	let date = new Date();

	let year_str = date.getFullYear();
	let month_str = date.getMonth() + 1
	month_str = month_str.toString().padStart(2, "0");
	let day_str = date.getDate();
	day_str = day_str.toString().padStart(2, "0");

	let date_string = year_str + "-" + month_str + "-" + day_str;
	return date_string;
}

async function checkLogin() {
	localforage.getItem("logged_in_lopolis").then((value) => {
		if (value != true) {
			$("#meals-container").hide();
			$("#meals-login-container").show();
		} else {
			$("#meals-container").show();
			$("#meals-login-container").hide();
			loadMeals();
		}
	}).catch((err) => {
		console.log(err);
	});
}

function setLoading(state) {
	if (state) {
		$("#loading-bar").removeClass("hidden");
	} else {
		$("#loading-bar").addClass("hidden");
	}
}

async function getToken(callback, callbackparams = []) {
	setLoading(true);
	let promises_to_run = [
		localforage.getItem("lopolis_username").then((value) => {
			username = value;
		}),
		localforage.getItem("lopolis_password").then((value) => {
			password = value;
		})
	];
	await Promise.all(promises_to_run);

	$.ajax({
		url: API_ENDPOINT + "gettoken",
		crossDomain: true,
		contentType: "application/json",
		data: JSON.stringify({
			"username": username,
			"password": password
		}),

		dataType: "json",
		cache: false,
		type: "POST",

		success: (dataauth) => {
			if (dataauth == null || dataauth.error == true) {
				UIAlert(D("authenticationError"), "getToken(): response error or null");
				localforage.setItem("logged_in_lopolis", false).then(function() {
					checkLogin();
				});
			} else if (dataauth.error == false) {
				let empty = {};
				empty.token = dataauth.data;
				let argumentsToCallback = [empty].concat(callbackparams);
				callback(...argumentsToCallback); // poslje token v {token: xxx}
			} else {
				UIAlert(D("authenticationError"), "getToken(): invalid response, no condition met");
			}
			setLoading(false);
		},
		error: () => {
			UIAlert(D("lopolisAPIConnectionError"), "getToken(): AJAX error");
			setLoading(false);
		}
	});
}

async function getMenus(dataauth, callback, callbackparams = []) {
	setLoading(true);
	let current_date = new Date();
	// naloži za dva meseca vnaprej (če so zadnji dnevi v mesecu)
	let mealsgathered = {};
	let promises_to_wait_for = [];
	for (let iteration = 1; iteration <= 2; iteration++) {

		promises_to_wait_for[iteration] = $.ajax({
			url: API_ENDPOINT + "getmenus",
			crossDomain: true,
			contentType: "application/json",
			data: JSON.stringify({
				"month": current_date.getMonth() + iteration,
				"year": current_date.getFullYear()
			}),

			headers: {
				"Authorization": `Bearer ${dataauth.token}`
			},

			dataType: "json",
			cache: false,
			type: "POST",

			success: (meals) => {
				if (meals == null || meals.error == true) {
					UIAlert(D("errorGettingMenus"), "getMenus(): response error or null");
					setLoading(false);
					localforage.setItem("logged_in_lopolis", false).then(() => {
						checkLogin();
					});
				} else if (meals.error == false) {
					setLoading(false);
					mealsgathered[iteration] = meals;
				} else {
					setLoading(false);
					UIAlert(D("errorUnexpectedResponse"), "getMenus(): invalid response, no condition met");
				}
			},

			error: () => {
				setLoading(false);
				UIAlert(D("lopolisAPIConnectionError"), "getMenus(): AJAX error");
			}
		});
	}

	await Promise.all(promises_to_wait_for); // javascript is ducking amazing

	let allmeals = {};
	let passtocallback = {};

	for (const [index, monthmeals] of Object.entries(mealsgathered)) { // although this is not very javascripty
		allmeals = mergeDeep(allmeals, monthmeals.data);
	}

	passtocallback.data = allmeals;
	passtocallback.token = dataauth.token;
	let toBePassed = [passtocallback].concat(callbackparams);
	callback(...toBePassed);

}

async function loadMeals() {
	getToken(getMenus, [displayMeals, []]);
}

function displayMeals(meals) {
	// console.log(JSON.stringify(meals)); // debug // dela!
	meals_data_global = meals.data;
	let transformed_meals = [];
	for (const [date, mealzz] of Object.entries(meals.data)) {
		let bg_color = "#877F02";	let fg_color = "#FFFFFF";
		if (mealzz.readonly) bg_color = "#8d9288";
		let meal_date = new Date(date+"+00:00"); // idk u figure it out. timezones
		let meal_object = {
			start: meal_date.toISOString().substring(0,10), // zakaj? poglej gradings.js - NUJNO! poglej, če so timezoni v redu! da slučajno ne preskakuje na naslednji dan!
			title: S("meal"),
			id: date,
			allDay: true,
			backgroundColor: bg_color,
			textColor: fg_color
		}
		transformed_meals.push(meal_object);
	}
	meals_calendar_obj.removeAllEvents();
	meals_calendar_obj.addEventSource(transformed_meals);
	return;
}

function clearMeals() {
	meals_calendar_obj.removeAllEvents();
}

function refreshMeals() {
	clearMeals();
	loadMeals();
}

function lopolisLogout() {
	localforage.setItem("logged_in_lopolis", false);
	$("#meals-collapsible").html("");
	checkLogin();
}

async function lopolisLogin() {
	setLoading(true);
	var usernameEl = $("#meals-username");
	var passwordEl = $("#meals-password");
	$.ajax({
		url: API_ENDPOINT + "gettoken",
		crossDomain: true,
		contentType: "application/json",
		data: JSON.stringify({
			"username": usernameEl.val(),
			"password": passwordEl.val()
		}),

		dataType: "json",
		cache: false,
		type: "POST",

		success: async function(data) {
			if (data == null) {
				UIAlert(S("requestForAuthenticationFailed"), "lopolisLogin(): date is is null");
				setLoading(false);
				usernameEl.val("");
				passwordEl.val("");
			} else if (data.error == true) {
				UIAlert(S("loginFailed"), "lopolisLogin(): login failed. data.error is true");
				usernameEl.val("");
				passwordEl.val("");
				setLoading(false);
			} else {
				let promises_to_run = [
					localforage.setItem("logged_in_lopolis", true),
					localforage.setItem("lopolis_username", usernameEl.val()),
					localforage.setItem("lopolis_password", passwordEl.val())
				];
				await Promise.all(promises_to_run);
				checkLogin();
				UIAlert("Credential match!");
			}
		},

		error: () => {
			UIAlert(D("loginError"), "lopolisLogin(): ajax.error");
			setLoading(false);
		}
	});
}

async function setMenus(currentmeals = 69, toBeSentChoices) { // currentmeals je getMenus response in vsebuje tudi token.

	if (currentmeals === 69) {
		getToken(getMenus, [setMenus, toBeSentChoices]);
		return;
	}

	for (const [mealzzdate, mealzz] of Object.entries(currentmeals.data)) {
		if (mealzzdate in toBeSentChoices === false) {
			for (const [mealid, mealdata] of Object.entries(mealzz.menu_options)) {
				// console.log(mealdata);
				if (mealdata.selected == true || mealzz.readonly == true) {
					toBeSentChoices[mealzzdate] = mealdata.value;
					break;
				}
			}
		}
	}

	setLoading(true);

	$.ajax({
		url: API_ENDPOINT + "setmenus",
		crossDomain: true,
		contentType: "application/json",
		data: JSON.stringify({
			"choices": toBeSentChoices
		}),
		headers: {
			"Authorization": "Bearer " + currentmeals.token
		},
		dataType: "json",
		cache: false,
		type: "POST",

		success: (response) => {
			if (response === null || response.error == true) {
				UIAlert(D("errorSettingMeals"), "setMenus(): response error or null");
			} else if (response.error == false) {
				UIAlert(D("mealSet"), "setMenus(): meni nastavljen");
			} else {
				UIAlert(D("errorUnexpectedResponse"), "setMenus(): invalid response, no condition met");
			}
			setLoading(false);
		},

		error: () => {
			setLoading(false);
			UIAlert(D("lopolisAPIConnectionError"), "setMenus(): AJAX error");
		}
	});
}
async function setMenu(date, menu) {
	let choice = {};
	choice[date] = menu;
	getToken(getMenus, [setMenus, choice]);
}


function setupEventListeners() {
	$("#meals-login").click(() => {
		lopolisLogin();
	});

	$("#meals-logout").click(() => {
		lopolisLogout();
	});
}

var mealClickHandler = (eventClickInfo) => {
	// console.log("meal clicked!"); // debug
	let meal_date = eventClickInfo.event.id;
	let meal_object = meals_data_global[meal_date];
	$("#meal-type").text(meal_object.meal);
	let meal_date_obj = new Date(meal_date);
	$("#meal-date").text(dateString.longFormatted(meal_date_obj));
	if(!(meal_object.readonly)) { // če je beljiv
		document.getElementById("meal-readonly").style.display="none";
	} else {
		document.getElementById("meal-readonly").style.display="block";
	}
	document.getElementById("meal-options").innerHTML = "";
	for(const [option_index, option_object] of Object.entries(meal_object.menu_options)) {
		let menu_option_li_el = document.createElement("li");
		let menu_option_a_el = document.createElement("button");
		menu_option_a_el.innerText = option_object.text;
		// console.log(JSON.stringify(meal_object)); // debug
		let classlist = "";
		if (option_object.selected != null) {
			if(option_object.selected) {
				// console.log("selected"); // debug
				//
				classlist = "color: green; font-weight: bold";
			}
		}
		menu_option_a_el.classList = "waves-effect waves-light btn-large";
		menu_option_a_el.style = "color: var(--color-text); background-color: rgba(0,0,0,0); line-height: 1.2; height:auto; "+classlist+" !important";
		menu_option_a_el.id = "menu_index_"+option_index;
		if(!(meal_object.readonly)) {
			menu_option_a_el.onclick = () => { 
				setMenu(meal_date, option_object.value);
				menu_option_a_el.className = "to-be-selected-meal";
				let sidenav_element = document.getElementById("meal-info");
				let sidenav_instance = M.Sidenav.getInstance(sidenav_element);
				sidenav_instance.close();
			};
		}
		menu_option_li_el.appendChild(menu_option_a_el);
		document.getElementById("meal-options").appendChild(menu_option_li_el);
	}
	let sidenav_element = document.getElementById("meal-info");
	let sidenav_instance = M.Sidenav.getInstance(sidenav_element);
	sidenav_instance.open();
}

// Initialization code
document.addEventListener("DOMContentLoaded", async () => {
	checkLogin();

	var calendarEl = document.getElementById("meals-calendar");
	meals_calendar_obj = new FullCalendar.Calendar(calendarEl, {
		firstDay: 1,
		plugins: ["dayGrid"],
		defaultDate: getDateString(),
		navLinks: false,
		editable: false,
		events: [],
		eventClick: mealClickHandler,
		height: "parent"
	});
	meals_calendar_obj.render();
	

	setupEventListeners();

	// Setup refresh handler
	$("#refresh-icon").click(function() {
		refreshMeals();
	});

	// Setup side menu
	const menus = document.querySelectorAll('.side-menu');
	M.Sidenav.init(menus, {
		edge: 'right',
		draggable: true
	});

	// Setup side modal
	const modals = document.querySelectorAll('.side-modal');
	M.Sidenav.init(modals, {
		edge: 'left',
		draggable: false
	});
	document.getElementsByClassName("fc-today-button")[0].style = "display:none !important"; // počasi bomo rabili nestane important stavke
	// ne vem, kaj je to spodaj ˇˇˇ
	var elemsx = document.querySelectorAll('select');
	M.FormSelect.init(elemsx);

	var datepickerelems = document.querySelectorAll('.datepicker');
	var today = new Date();
	M.Datepicker.init(datepickerelems, {
		firstDay: 1,
		minDate: today,
		showDaysInNextAndPreviousMonths: true,
		showClearBtn: true,
		format: "dddd, dd. mmmm yyyy"
	});

	refreshMeals();
});
