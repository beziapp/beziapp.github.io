const API_ENDPOINT = "https://lopolis-api.gimb.tk/"; // unused!

var meals_calendar_obj = null;
var meals_data_global = {};
var checkouts_data_global = {};
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
	try {
		var lopolisClient = new lopolisc();
		var response = await lopolisClient.login(username, password);
		// če response ni true bo itak exception
	} catch (e) {
		console.log(e);
		UIAlert(D("authenticationError"), "getToken(): invalid response, no condition met");
		await localforage.setItem("logged_in_lopolis", false);
		return false;
	}
	await localforage.setItem("logged_in_lopolis", true);
	let empty = {};
	empty.token = {}; // tokenov NI VEČ! old code pa to
	let argumentsToCallback = [empty].concat(callbackparams);
	callback(...argumentsToCallback); // poslje token v {token: xxx}
}

async function getMenus(dataauth, callback, callbackparams = []) {
	setLoading(true);
	let passtocallback = {};
	let allmeals, allcheckouts;
	let tries = 3;
	while (true) {
		try {
			let lopolisClient = new lopolisc();
			allmeals = await lopolisClient.fetchAllMeals();
			allcheckouts = await lopolisClient.fetchAllCheckouts();
		} catch (e) {
			console.log(e);
			UIAlert(D("lopolisAPIConnectionError"), "getMenus(): AJAX error");
			if (tries-- < 0) {
				return false;
			} else {
				continue;
			}
		}
		break;
	}
	passtocallback.data = allmeals; // kot po starem apiju so meniji še vedno tu!!
	passtocallback.checkouts = allcheckouts;
	passtocallback.token = "tokens-not-used-anymore";
	let toBePassed = [passtocallback].concat(callbackparams);
	callback(...toBePassed);
}

async function loadMeals() {
	getToken(getMenus, [displayMeals, []]);
}

function displayMeals(meals) {
	// console.log(JSON.stringify(meals)); // debug // dela!
	meals_data_global = meals.data;
	checkouts_data_global = meals.checkouts;
	let transformed_meals = [];
	for (const [date, mealzz] of Object.entries(meals.data)) {
		let bg_color = "#877F02";	let fg_color = "#FFFFFF";
		if (mealzz.readonly) bg_color = "#8d9288";
		let meal_date = new Date(date+"+00:00"); // idk u figure it out. timezones
		let meal_object = {
			start: meal_date.toISOString().substring(0,10), // zakaj? poglej gradings.js - NUJNO! poglej, če so timezoni v redu! da slučajno ne preskakuje na naslednji dan!
			title: mealzz.meal,
			id: date,
			allDay: true,
			backgroundColor: bg_color,
			textColor: fg_color
		}
		transformed_meals.push(meal_object);
	}
	meals_calendar_obj.removeAllEvents();
	meals_calendar_obj.addEventSource(transformed_meals);
	setLoading(false);
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
	localforage.setItem("logged_in_lopolis", false).then(()=>{
		clearMeals();
		checkLogin();
	});
}

async function lopolisLogin() {
	setLoading(true);
	var usernameEl = $("#meals-username");
	var passwordEl = $("#meals-password");
	try {
		let l = new lopolisc();
		await l.login(usernameEl.val(), passwordEl.val());
	} catch (e) {
		UIAlert(D("loginError"), "lopolisLogin(): ajax.error");
		setLoading(false);
		return false;
	}
	let promises_to_run = [
		localforage.setItem("logged_in_lopolis", true),
		localforage.setItem("lopolis_username", usernameEl.val()),
		localforage.setItem("lopolis_password", passwordEl.val())
	];
	await Promise.all(promises_to_run);
	checkLogin();
	UIAlert("Credential match!");
	return true;
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
	let meal_date = eventClickInfo.event.id;
	let meal_object = meals_data_global[meal_date];

	/// ˇˇˇ checkouts
	$("#checkout_label").show();		let can_do_checkout = true;
	let checkout_object;
	try {
		checkout_object = checkouts_data_global[meal_date];
	} catch (e) {
		$("#checkout_label").hide();	let can_do_checkout = false;
	}
	if (checkout_object == undefined || checkout_object == null) {
		can_do_checkout = false;
	}
	console.log(checkout_object);
	if (can_do_checkout) { let cc = $("#checkout_checkbox");
		cc[0].checked/*in*/ = !(checkout_object.checked/*out*/);
		cc.off();
		cc.on("change", ()=>{
			let l = new lopolisc();
			checkouts_data_global[meal_date].checked/*out*/ = !(cc[0].checked/*in*/);
			setLoading(true);
			l.setCheckouts(checkouts_data_global).then(()=>{ // update server checkots
				UIAlert(D("successfulCheckingInOut"), "successfulcheckinginout");
				setLoading(false);
			}).catch(()=>{
				UIAlert(D("errorCheckingInOut"), "errorcheckinginout");
				setLoading(false);
			});
		});
		cc.prop("disabled", checkout_object.readonly);
	}
	/// ^^^ checkouts
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
		let classlist = "";
		if (option_object.selected != null) {
			if(option_object.selected) {
				classlist = "color: green; font-weight: bold";
			}
		}
		menu_option_a_el.classList = "waves-effect waves-light btn-large";
		menu_option_a_el.style = "color: var(--color-text); background-color: rgba(0,0,0,0); line-height: 1.2; height:auto; "+classlist+" !important";
		menu_option_a_el.id = "menu_index_"+option_index;
		if(!(meal_object.readonly)) {
			menu_option_a_el.disabled = false;
			menu_option_a_el.onclick = () => {
				setLoading(true);
				let l = new lopolisc();
				l.chooseMenu(meals_data_global[meal_date], option_index);
				l.setMeals(meals_data_global).then(()=>{
					UIAlert(D("mealSet"), "meal set!");
					setLoading(false);
				}).catch(()=>{
					UIAlert(D("errorSettingMeals"), "error setting meals");
					setLoading(false);
				});
				menu_option_a_el.className = "to-be-selected-meal";
				let sidenav_element = document.getElementById("meal-info");
				let sidenav_instance = M.Sidenav.getInstance(sidenav_element);
				sidenav_instance.close();
			};
		} else {
			menu_option_a_el.disabled = true;
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
	await find_chosen_lang();
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
		setLoading(true);
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

	// refreshMeals(); // checklogin already does this
});
