const API_ENDPOINT = "https://lopolis-api.gimb.tk/";

async function checkLogin() {
	localforage.getItem("logged_in_lopolis").then((value) => {
		if (value != true) {
			$("#meals-container").hide();
			$("#meals-login").show();
		} else {
			$("#meals-container").show();
			$("#meals-login").hide();
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
			if(dataauth === null || dataauth.error == true) {
				UIAlert(D("authenticationError"), "getToken(): response error or null");
				localforage.setItem("logged_in_lopolis", false).then( function(){
					checkLogin();
				});
			} else if (dataauth.error == false) {
				let empty = {};
				empty.token = dataauth.data;
				let argumentsToCallback = [empty].concat(callbackparams);
				callback(...argumentsToCallback); // poslje token v {token: xxx}
			} else {
				UIAlert( D("authenticationError"), "getToken(): invalid response, no condition met");
			}
			setLoading(false);
		},
		error: () => {
			UIAlert( D("lopolisAPIConnectionError"), "getToken(): AJAX error");
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
			url: API_ENDPOINT+"getmenus",
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
				if(meals === null || meals.error == true) {
					UIAlert( D("errorGettingMenus"), "getMenus(): response error or null");
					setLoading(false);
					localforage.setItem("logged_in_lopolis", false).then( () => {
						checkLogin();
					});
				} else if (meals.error == false) {
					setLoading(false);
					mealsgathered[iteration] = meals;
					} else {
					setLoading(false);
					UIAlert( D("errorUnexpectedResponse") , "getMenus(): invalid response, no condition met");
				}
			},

			error: () => {
				setLoading(false);
				UIAlert( D("lopolisAPIConnectionError"), "getMenus(): AJAX error");
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

	let root_element = document.getElementById("meals-collapsible");
	for (const [date, mealzz] of Object.entries(meals.data)) {
		let unabletochoosequestionmark = "";
		let readonly = mealzz.readonly;
		var datum = new Date(date);

		// Create root element for a date entry
		let subject_entry = document.createElement("li");

		// Create subject collapsible header
		let subject_header = document.createElement("div");
		subject_header.classList.add("collapsible-header");
		subject_header.classList.add("collapsible-header-root");

		// Create header text element
		let subject_header_text = document.createElement("span");

		if(mealzz.readonly) {
			unabletochoosequestionmark = `*${S("readOnly")}*`;
		}
	
		// Use ES6 templates
		subject_header_text = `${dateString.day(datum.getDay())}, ${datum.getDate()}. ${dateString.month(datum.getMonth())} ${datum.getFullYear()} (${mealzz.meal} @ ${mealzz.location}) ${unabletochoosequestionmark}`;
	
		// Create collection for displaying individuals meals
		let subject_body = document.createElement("div");
		subject_body.className = "collapsible-body";
		let subject_body_root = document.createElement("ul");
		subject_body_root.className = "collection";
	
		for(const [dindex, dmil] of Object.entries(mealzz.menu_options)) {
			// Create element for individual meal
			let meal_node = document.createElement("li");
			meal_node.className = "collection-item";
			meal_node.classList.add("collection-item")
			meal_node.classList.add("meal-node");
			meal_node.dataset["index"] = dindex;

			if (!readonly) {
				meal_node.onclick = () => {
					setMenu(date, dmil.value);
				}
			}
		
			let meal_node_div = document.createElement("div");
			// Node for left text
			let meal_lefttext = document.createElement("span");
			// Node for the right text
			let meal_righttext = document.createElement("div");
			meal_righttext.className = "secondary-content";
			// Apply different style, if the meal is selected
			if (dmil.selected) {
				// Text
				meal_lefttext.innerHTML = `<i>${dmil.text}</i>`;
				// Number
				meal_righttext.innerText = S("selected");
			} else {
				// Text
				meal_lefttext.innerText = dmil.text;
				// Number
				meal_righttext.innerText = "";
			}
			meal_node_div.appendChild(meal_lefttext);
			meal_node_div.appendChild(meal_righttext);
			meal_node.appendChild(meal_node_div);
			subject_body_root.appendChild(meal_node);
		}

		subject_header.appendChild(subject_header_text);
		subject_body.append(subject_body_root);
		subject_entry.append(subject_header);
		subject_entry.append(subject_body);
		root_element.append(subject_entry);
	}
	$("#meals-collapsible").append(root_element);
	// refreshClickHandlers();
}

function clearMeals() {
	const table = document.getElementById("meals-collapsible");
	while (table.firstChild) {
		table.removeChild(table.firstChild);
	}
}

function refreshMeals(force) {
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
	var usernameEl = $("#meals_username");
	var passwordEl = $("#meals_password");
	$.ajax({
		url: API_ENDPOINT+"gettoken",
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
			if(data == null) {
				UIAlert( S("requestForAuthenticationFailed"), "lopolisLogin(): date is is null");
				setLoading(false);
				usernameEl.val("");
				passwordEl.val("");
			} else if(data.error == true) {
				UIAlert( S("loginFailed"), "lopolisLogin(): login failed. data.error is true");
				usernameEl.value = "";
				passwordEl.value = "";
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
			UIAlert( D("loginError"), "lopolisLogin(): ajax.error");
			setLoading(false);
		}
	});
}

async function setMenus(currentmeals = 69, toBeSentChoices) { // currentmeals je getMenus response in vsebuje tudi token.

	if (currentmeals === 69) {
		getToken(getMenus, [setMenus, toBeSentChoices]);
		return;
	}

	for(const [mealzzdate, mealzz] of Object.entries(currentmeals.data)) {
		if(mealzzdate in toBeSentChoices) {} else {
			for (const [mealid, mealdata] of Object.entries(mealzz.menu_options)) {
				console.log(mealdata);
				if(mealdata.selected == true || mealzz.readonly == true) {
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
		data: JSON.stringify( { "choices": toBeSentChoices } ),
		headers: {
			"Authorization": "Bearer " + currentmeals.token
		},
		dataType: "json",
		cache: false,
		type: "POST",

		success: (response) => {
			if(response === null || response.error == true) {
				UIAlert( D("errorSettingMeals"), "setMenus(): response error or null");
			} else if (response.error == false) {
				UIAlert( D("mealSet"), "setMenus(): meni nastavljen");
			} else {
				UIAlert( D("errorUnexpectedResponse"), "setMenus(): invalid response, no condition met");
			}
			setLoading(false);
		},

		error: () => {
			setLoading(false);
			UIAlert( D("lopolisAPIConnectionError"), "setMenus(): AJAX error");
		}
	});
}
async function setMenu(date, menu) {
	let choice = {};
	choice[date] = menu;
	getToken(getMenus, [setMenus, choice]);
}

// Initialization code
document.addEventListener("DOMContentLoaded", async () => {
	checkLogin();
	let coll_elem = document.querySelectorAll('.collapsible');
	let coll_instance = M.Collapsible.init(coll_elem, {});

	// Setup refresh handler
	$("#refresh-icon").click(function () {
		refreshMeals(true);
	});

	let elems = document.querySelectorAll('.modal');
	let instances = M.Modal.init(elems, {});
	// Setup side menu
	const menus = document.querySelectorAll('.side-menu');
	M.Sidenav.init(menus, { edge: 'right', draggable: true });

	// Setup side modal
	const modals = document.querySelectorAll('.side-modal');
	M.Sidenav.init(modals, { edge: 'left', draggable: false });

	var elemsx = document.querySelectorAll('select');
	var instancesx = M.FormSelect.init(elemsx);
	var datepickerelems = document.querySelectorAll('.datepicker');
	var today = new Date();
	var datepickerinstances = M.Datepicker.init(datepickerelems, {
		firstDay: 1,
		minDate: today,
		showDaysInNextAndPreviousMonths: true,
		showClearBtn: true,
		format: "dddd, dd. mmmm yyyy"
	});

	refreshMeals();
});
