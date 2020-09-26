function getStringBetween(string, start, end) {
	return string.split(start).pop().split(end)[0];
}

const LOPOLIS_URL = "https://lopolis.gimb.tk/";
const LOPOLISC_ERR_NET = "LOPOLSIC NETWORK ERROR (ajax error)";
const	LOPOLISC_ERR_NET_POSTBACK_GET = "LOPOLISC NETWORK ERROR (ajax error) in postback GET"
const LOPOLISC_ERR_NET_POSTBACK_POST = "LOPOLISC NETWORK ERROR (ajax error) in postback POST"
const LOPOLISC_ERR_LOGIN = "LOPOLISC LOGIN ERROR";
const LOPOLISC_ERR_NOTAPPLIED = "LOPOLISC DATA NOT APPLIED ERROR"
const LOPOLISC_SIGNATURE = "lopolisc.js neuradni API - anton<at>sijanec.eu"

class lopolisc {

	constructor() {
	}

	parseAndPost(inputHTML, userParams, formId = null, useDiffAction = null) {
		return new Promise((resolve, reject) => {
			let parser = new DOMParser();
			let parsed = parser.parseFromString(inputHTML, "text/html");

			var form;
			if (formId == null) {
				form = parsed.getElementsByTagName("form")[0];
			} else {
				form = parsed.getElementById(formId);
			}

			var params = {};
			var otherParams = $(form).serializeArray();
			for (const input of otherParams) {
				if (!(input.name in params)) {
					params[input.name] = input.value; // so we don't overwrite existing values
				}
			}

			for (const [key, value] of Object.entries(userParams)) { // neki me je
				params[key] = value; // zajebaval, pa sem tkole naredu - še enkrat
			} // prepišemo vse, kar je v params, z uporabniškimi parametri
			// POPRAVEK PO 2 min debugganja: ne, nič ni bilo narobe, pozabil sem
			// passat dataToSend v postback(), passal sem {} :facepalm: </notetoself>
			var action;
			if (useDiffAction == null || useDiffAction == false) {
				action = new URL($(form).attr("action"), LOPOLIS_URL); // absolute == relative + base
			} else {
				action = useDiffAction;
			}

			params["programska-oprema"] = LOPOLISC_SIGNATURE;
			$.ajax({
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				url: action,
				cache: false,
				type: "POST",
				data: params,
				dataType: "text",
				success: (postData, textStatus, xhr) => {
					resolve({data: postData, textStatus: textStatus, code: xhr.status});
				},
				error: () => {
					reject(new Error(LOPOLISC_ERR_NET_POSTBACK_POST));
				}
			});
		});
	}

	postback(getUrl, params = {}, formId = null, useDiffAction = null) {
		return new Promise( (resolve, reject) => {
			$.ajax({
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				url: getUrl,
				cache: false,
				type: "GET",
				dataType: "html",
				success: (data) => {
					if (useDiffAction == true) {
						useDiffAction = getUrl;
					}
					this.parseAndPost(data, params, formId, useDiffAction).then((value) => {
						resolve(value);
					});
				},
				error: () => {
					reject(new Error(LOPOLISC_ERR_NET_POSTBACK_GET));
				}
			});
		});
	}

	login(usernameToLogin, passwordToLogin) {
		return new Promise((resolve, reject) => {
			var dataToSend = {
				"Uporabnik": usernameToLogin,
				"Geslo": passwordToLogin,
				"OsveziURL": "https://pornhub.com/\"; lopolis=\"boljsi od easistenta",
			};
			this.postback(LOPOLIS_URL + "Uporab/Prijava", dataToSend, null, true).then((response) => { // če je true, bo URL, če je false, bo action
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				if (parsed.getElementById("divPrijavaOsvezi") != null) {
					resolve(true);
				}
				reject(new Error(LOPOLISC_ERR_LOGIN));
			});
		});
	}

	fetchCheckouts(date_object = null) {
		if (date_object == null) {
			date_object = new Date();
		}
		return new Promise((resolve, reject) => {
			var dataToSend = {
				"MesecModel.Mesec": String(date_object.getMonth()+1),
				"MesecModel.Leto": String(date_object.getFullYear()),
				"Ukaz": ""
			};
			this.postback(LOPOLIS_URL+"Prehrana/Odjava", dataToSend, null, true).then((response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				let checkouts = {};
				for (const element of parsed.getElementsByTagName("tbody")[0].
															getElementsByTagName("tr")) {
					let date_idx = element.getElementsByTagName("input")[2].value;
					checkouts[date_idx] = {
						checked: element.getElementsByTagName("input")[0].checked,
						readonly: element.getElementsByTagName("input")[0].disabled,
						// spodaj spremenljivke, ki so potrebne za submit (ne-API)
						index: Number(getStringBetween( // string, start, end
							element.getElementsByTagName("input")[0].name, "[", "]"
						)),
						"OsebaModel.ddlOseba":
							parsed.getElementsByTagName("option")[0].value,
						"OsebaModel.OsebaID":
							parsed.getElementById("OsebaModel_OsebaID").value,
						"OsebaModel.OsebaTipID":
							parsed.getElementById("OsebaModel_OsebaTipID").value,
						"OsebaModel.UstanovaID":
							parsed.getElementById("OsebaModel_UstanovaID").value,
						"MesecModel.Mesec": parsed.getElementById("MesecModel_Mesec").value,
						"MesecModel.Leto": parsed.getElementById("MesecModel_Leto").value
					}
					checkouts[date_idx][element.getElementsByTagName("input")[2].name] =
						String(element.getElementsByTagName("input")[2].value);
					checkouts[date_idx][element.getElementsByTagName("input")[3].name] =
						String(element.getElementsByTagName("input")[3].value);
					checkouts[date_idx][element.getElementsByTagName("input")[4].name] =
						String(element.getElementsByTagName("input")[4].value);
				}
				resolve(checkouts);
			});
		});
	}

	setCheckouts(odjava_objects) {
		return new Promise((resolve, reject) => {
			var dataToSend = { "Ukaz": "Shrani" };
			for (const [odjava_da, odjava_object] of Object.entries(odjava_objects)) {
				for (const [index, property] of Object.entries(odjava_object)) {
					dataToSend[index] = property;
				}
				dataToSend["OdjavaItems["+odjava_object.index+".CheckOut"] =
					String(odjava_object.checked);
			} // now we have some excess values, who cares (index, readonly, checked)
			this.postback(LOPOLIS_URL+"Prehrana/Odjava", dataToSend, null, true).
				then( (response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				for (const [od_date, odjava_object] of Object.entries(odjava_objects)) {
					if (!(parsed.getElementById("OdjavaItems_"+odjava_object.index+"__CheckOut").checked == odjava_object.checked)) {
						reject(LOPOLISC_ERR_NOTAPPLIED);
					}
				}
				resolve(true);
			});
		});
	}

	fetchMeals(date_object = null) { // todo: fetchAllMeals(): naslednja 2 meseca
		if (date_object == null) {
			date_object = new Date();
		}
		return new Promise((resolve, reject) => {
			var meals = {};
			var dataToSend = {
				"Ukaz": "",
				"MesecModel.Mesec": String(date_object.getMonth()+1),
				"API-METODA": "fetchMeals",
				"MesecModel.Leto": String(date_object.getFullYear())
			}
			this.postback(LOPOLIS_URL+"Prehrana/Prednarocanje",dataToSend,null,true).
				then((response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				for (const element of parsed.getElementsByTagName("tbody")[0].
															getElementsByTagName("tr")) {
					let menuoptions = [];
					let is_any_selected = false;
					for (const opt of element.getElementsByTagName("select")[0].options) {
						if (opt.value.length > 0 || 1==1) { // tudi prazno opcijo pustimo
							menuoptions.push({
								value: opt.value,
								text: opt.innerText,
								selected: opt.selected
							});
						}
						if (opt.selected) {
							is_any_selected = true;
						}
					}
					if (!is_any_selected) {
						menuoptions[0].selected = true; // !!! KAJ GRE LAHKO NAROBE:
						// * če je readonly je itak en izbran
						// * če je en izbran je itak en izbran
						// * če noben ni izbran in je readonly se izbere prazna - okej
						// * če noben ni izbran in je readonly se izbere prazna - okej
						// prazna (index 0) defaulta na meni 1 (index 1) ampak ne bom tvegal
					}
					let date_idx = element.getElementsByTagName("input")[0].value;
					meals[date_idx] = {	// trying to keep same api as rstular's lopolisapi
						meal: element.getElementsByTagName("td")[1].innerText.trim(),
						"menu-type": element.getElementsByTagName("td")[2].innerText.trim(),
						location: element.getElementsByTagName("td")[3].innerText.trim(),
						readonly: element.getElementsByTagName("select")[0].disabled,
						menu_options: menuoptions,
						// properties below are "private" and non-API (undocumented even)
						index: Number(getStringBetween( // string, start, end
							element.getElementsByTagName("input")[0].name, "[", "]"
						)),
						"OsebaModel.ddlOseba":
							parsed.getElementsByTagName("option")[0].value,
						"OsebaModel.OsebaID":
							parsed.getElementById("OsebaModel_OsebaID").value,
						"OsebaModel.OsebaTipID":
							parsed.getElementById("OsebaModel_OsebaTipID").value,
						"OsebaModel.UstanovaID":
							parsed.getElementById("OsebaModel_UstanovaID").value,
						"MesecModel.Mesec": parsed.getElementById("MesecModel_Mesec").value,
						"MesecModel.Leto": parsed.getElementById("MesecModel_Leto").value
						}
						meals[date_idx][element.getElementsByTagName("input")[0].name] =
							String(element.getElementsByTagName("input")[0].value); // date
						meals[date_idx][element.getElementsByTagName("input")[1].name] =
							String(element.getElementsByTagName("input")[1].value); // prijOID?
						meals[date_idx][element.getElementsByTagName("input")[2].name] =
							String(element.getElementsByTagName("input")[2].value); // readonly
				}
				resolve(meals);
			});
		});
	}

	setMeals(meal_objects) {
		return new Promise((resolve, reject) => {
			var dataToSend = { "Ukaz": "Shrani" };
			for (const [meal_date, meal_object] of Object.entries(meal_objects)) {
				for (const [index, property] of Object.entries(meal_object)) {
					dataToSend[index] = String(property);
				}
				for (const menu_option of meal_object.menu_options) {
					if (menu_option.selected) {
						dataToSend["PrednarocanjeItems["+meal_object.index+
							"].MeniIDSkupinaID"] = menu_option.value;
					}
				}
			} // excess values: meal, menu-type, location, readonly, menu_options
			this.postback(LOPOLIS_URL+"Prehrana/Prednarocanje",dataToSend,null,true).
					then( (response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				for (const [meal_date, meal_object] of Object.entries(meal_objects)) {
					let selected_value;
					for (const menu_option of meal_object.menu_options) {
						if (menu_option.selected) {
							selected_value = menu_option.value;
						}
					}
					if (!(parsed.getElementById("PrednarocanjeItems_"+meal_object.index+"__MeniIDSkupinaID").selectedOptions[0].value == selected_value)) {
						reject(LOPOLISC_ERR_NOTAPPLIED);
					}
				}
				resolve(true);
			});
		});
	}
}

//   Edited with    \  / o  _ _    this script is     I         /\/\        2020
//   Improved & free \/  I I I I   vim-powered        my editor \__/  -- sijanec
