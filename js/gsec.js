// tab = 2 || any spaces; use tabs
// not tested yet -- NOTE: document.createElement is xssy, use DOMParser!
var gseAbsenceTypes = ["notProcessed", "authorizedAbsence", "unauthorizedAbsence", "doesNotCount"];

function get_string_between(string, start, end) {
	return string.split(start).pop().split(end)[0];
}

function stripHtml(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

function slDayToInt(inputString) { // wtf
	let fourChars = inputString.substring(1, 5);
	let fourCharDays = ["oned", "orek", "reda", "etrt", "etek", "obot", "edel"];
	return fourCharDays.indexOf(fourChars);
}

const GSE_URL = "https://zgimsis.gimb.tk/gse/";
const GSEC_ERR_NET = "GSEC NETWORK ERROR (ajax error)";
const GSEC_ERR_NET_POSTBACK_GET = "GSEC NETWORK ERROR (ajax error) in postback GET"
const GSEC_ERR_NET_POSTBACK_POST = "GSEC NETWORK ERROR (ajax error) in postback POST"
const GSEC_MSGTYPE_RECEIVED = 0;
const GSEC_MSGTYPE_SENT = 1;
const GSEC_MSGTYPE_DELETED = 2;
const GSEC_ERR_LOGIN = "GSEC LOGIN ERROR";
const GSEC_NO_ABSENCES = "noAbsences";
const GSEC_MSGTYPES = ["msgReceived", "msgSent", "msgDeleted"];

class gsec {

	constructor() {
	}

	parseAndPost(inputHTML, params, formId = null, useDiffAction = null) {
		return new Promise((resolve, reject) => {
			let parser = new DOMParser();
			let parsed = parser.parseFromString(inputHTML, "text/html");
			if (formId == null) {
				var form = parsed.getElementsByTagName("form")[0];
			} else {
				var form = parsed.getElementById(formId);
			}
			var otherParams = $(form).serializeArray();
			for (const input of otherParams) {
				if (!(input.name in params)) {
					params[input.name] = input.value; // so we don't overwrite existing values
				}
			}
			if (useDiffAction == null || useDiffAction == false) {
				var action = new URL($(form).attr("action"), GSE_URL); // absolute == relative + base
			} else {
				var action = useDiffAction;
			}
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
					reject(new Error(GSEC_ERR_NET_POSTBACK_POST));
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
				type: "GET",
				dataType: "html",
				success: (data, textStatus, request) => {
					if (useDiffAction == true) {
						useDiffAction = getUrl;
					}
					this.parseAndPost(data, params, formId, useDiffAction).then((value) => {
						resolve(value);
					});
				},
				error: () => {
					reject(new Error(GSEC_ERR_NET_POSTBACK_GET));
				}
			});
		});
	}

	login(usernameToLogin, passwordToLogin) {
		return new Promise((resolve, reject) => {
			var dataToSend = {
				"edtGSEUserId": usernameToLogin,
				"edtGSEUserPassword": passwordToLogin,
				"btnLogin": "Prijava"
			};
			this.postback(GSE_URL + "Logon.aspx", dataToSend, null, true).then((response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				if (response.code === 302) {
					resolve(true);
				} else {
					if (parsed.getElementById("lblMsg")) { // če obstaja lblMsg (napaka pri prijavi)
						reject(new Error(GSEC_ERR_LOGIN));
					} else if (!(parsed.getElementById("ctl00_lblLoginName"))) { // če ni ctl00_lblLoginName nismo na Default.aspx
						reject(new Error(GSEC_ERR_LOGIN));
					} else {
						resolve(parsed.getElementById("ctl00_lblLoginName").innerHTML); // vrne ime dijaka, to je lahko uporabno
					}
				}
			});
		});
	}

	fetchSessionData() {
		return new Promise((resolve, reject) => {
			$.ajax({
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				url: GSE_URL + "WS_Gim/wsGimSisUtils.asmx/GetSessionData",
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				data: "{}",
				processData: false,
				success: (data, textStatus, xhr) => {
					var podatki = {};
					podatki[0] = data.d.split(", ")[0];
					podatki[1] = data.d.split(", ")[1];
					podatki["username"] = data.d.split(", ")[1];
					podatki[2] = data.d.split(", ")[2];
					podatki[3] = data.d.split(", ")[3];
					podatki["sessionCookie"] = data.d.split(", ")[3];
					podatki[4] = data.d.split(", ")[4];
					resolve({"data": podatki, "textStatus": textStatus, "code": xhr.status});
				},
				error: () => {
					reject(new Error(false));
				}
			});
		});
	}

	fetchTeachersDirectory() {
		return new Promise((resolve, reject) => {
			var current_date = new Date();
			if (current_date.getMonth() < 7) { // če še ni avgust uporabimo preteklo leto/letnico
				var letnica = current_date.getFullYear()-1;
			} else { // je že po avgustu (september), uporabimo trenutno letnico
				var letnica = current_date.getFullYear();
			} // skratka uporabi se prvi sklop številk v šolskem letu TOLE(/xxxx)
			$.ajax({
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				url: GSE_URL + "Page_Gim/Uporabnik/modSporociloPrejemniki.aspx/NajdiOsebePrejemniki",
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify({
					"aIdOsebeRe": "",
					"aIdSolskoLeto": Number(letnica).toString(),
					"aMsgType": "null",
					"aIdType": "null",
					"aIdUcitelj": "",
					"aFilter": null
				}),
				// note about the nulls, "null"s and ""s: this is actually how zgimsisext2016 javascripts sends it.
				processData: false,
				success: (data, textStatus, xhr) => {
					var teachersDirectory = data.d.split(";"); // data.d je "12434=Ime Primek (učitelj);75353=Ime Drugega Priimek (učitelj)";
					teachersDirectory.pop(); // pop, ker se string konča z ;
					var formatted = {};
					teachersDirectory.forEach((v) => {
						formatted[v.split("=")[1].split(" (")[0]] = v.split("=")[0];
					});
					resolve(formatted);
				},
				error: () => {
					reject(new Error(false));
				}
			});
		});
	}

	fetchTimetable(datum = null) {
		if (datum == null) {
			var dataToSend = {};
		} else {
			var dataToSend = {
				"ctl00$ContentPlaceHolder1$wkgDnevnik_edtGridSelectDate": `${datum.getDate()}.${Number(datum.getMonth()+1)}.${datum.getFullYear()}`
			};
		}
		return new Promise((resolve, reject) => {
			var urnik = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6:{} } ;
			this.postback(GSE_URL+"Page_Gim/Ucenec/DnevnikUcenec.aspx", dataToSend, null, true).then( (response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				for (const urnikElement of parsed.querySelectorAll('*[id^="ctl00_ContentPlaceHolder1_wkgDnevnik_btnCell_"]')) {
					var subFields = urnikElement.id.split("_");
					var period = subFields[4];
					var day = subFields[5];
					var desc = $(urnikElement).attr("title").split("\n");
					var subject = desc[1].split('(').pop().split(')')[0]; // https://stackoverflow.com/a/27522597/11293716
					var abkurzung = desc[1].split(" (")[0];
					var razred = desc[2];
					var teacher = desc[3];
					var place = desc[4];
					urnik[day][period] = {
						"subject": subject,
						"acronym": abkurzung,
						"class": razred,
						"teacher": teacher,
						"place": place
					};
				}
				resolve(urnik);
			});
		});
	}

	fetchGradings() {
		return new Promise((resolve, reject) => {
			var gradings = [];
			this.postback(GSE_URL + "Page_Gim/Ucenec/IzpitiUcenec.aspx", {}, null, true).then( (response) => {

				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");

				var rowElements = parsed.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0].getElementsByTagName("tr");

				for (const row of rowElements) {
					var subFields = row.getElementsByTagName("td");
					var date = subFields[0].innerHTML.trim().split(".");
					var dateObj = new Date(date[2]+"-"+date[1]+"-"+date[0]);
					var rowSpan = subFields[1].getElementsByTagName("span")[0];
					var abkurzung = "";

					if (rowSpan) {
						abkurzung = rowSpan.innerHTML.trim();
					}

					rowSpan.remove(); // magic
					var subject = subFields[1].innerHTML.split(" (")[0].trim();
					var desc = subFields[1].innerHTML.split('(').pop().split(')')[0];

					gradings.push({
						"date": dateObj,
						"acronym": abkurzung,
						"subject": subject,
						"description": desc
					});
				}
				resolve(gradings);
			});
		});
	}

	fetchTeachers() { // razrednika ne vrne kot razrednika, če le-ta uči še en predmet. razlog: razrednik je napisan dvakrat, drugič se prepiše. Ne da se mi popravljat.
		return new Promise((resolve, reject) => {
			var Teachers = {};
			
			this.postback(GSE_URL + "Page_Gim/Ucenec/UciteljskiZbor.aspx", {}, null, true).then((response) => {

				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");

				var rowElements = parsed.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0].getElementsByTagName("tr");

				for (const row of rowElements) {
					var subFields = row.getElementsByTagName("td");
					var name = stripHtml(subFields[0].innerHTML); // razrednik je namreč bold tekst!
					var subjectStrings = subFields[2].innerHTML.split("<br>");
					var subjects = {};

					for (const subjectString of subjectStrings) {
						var abkurzung = "";
						var subjectName = stripHtml(subjectString).split(" (")[0];
						abkurzung = stripHtml(subjectString).split('(').pop().split(')')[0];
						subjects[abkurzung] = subjectName;
					}

					var TP = {};
					TP.day = slDayToInt(subFields[3].innerHTML.split(", ")[0]);
					TP.period = Number( subFields[3].innerHTML.split(", ").pop().split(". ura")[0] );
					TP.from = subFields[3].innerHTML.split("(").pop().split(")")[0].split(" - ")[0];
					TP.till = subFields[3].innerHTML.split("(").pop().split(")")[0].split(" - ")[1];
					if (TP.day < 0) { // indexOf vrne -1, če v arrayu ne najde dneva (&nbsp;)
						TP = false;
					}

					Teachers[name] = { "subjects" : subjects , "tpMeetings" : TP };
				}
				resolve(Teachers);
			});
		});
	}

	sendMessage(recipient, subject = " ", body = " ") {
		return new Promise((resolve, reject) => {
			var dataToSend = {
				"ctl00$ModalMasterBody$edtPrejemniki": "",
				"ctl00$ModalMasterBody$edtZadeva": subject,
				"ctl00$ModalMasterBody$edtBesediloExt": body,
				"__EVENTTARGET": "ctl00$ModalMasterBody$btnDogodekShrani",
				"__EVENTARGUMENT": "",
				"ctl00$ModalMasterBody$hfPrejemniki": recipient
			};
			this.postback(GSE_URL+"Page_Gim/Uporabnik/modSporocilo.aspx?params=", dataToSend, null, true).then((response)=>{
				resolve(null);
			});
		});
	}
	deleteMessage(id) {
		return new Promise((resolve, reject) => {
			$.ajax({
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				url: GSE_URL + "Page_Gim/Uporabnik/Sporocila.aspx/DeleteMessage",
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify({
					"aIdSporocilo": id.split("|")[0],
					"aIdZapis": id.split("|")[1]
				}),
				processData: false,
				success: (data, textStatus, xhr) => {
					if(data.d == true) {
						resolve(true);
					} else {
						reject(new Error(false));
					}
				},
				error: () => {
				reject(new Error(GSEC_ERR_NET));
				}
			});
		});
	}

	fetchAbsences(fromDate = null, tillDate = null) { // navedba datumov je deprecated. Internet je dovolj hiter za poslat maksimalno 4160 ur (16 ur/dan, 5 dni/ted, 52 ted/leto)
		return new Promise((resolve, reject)=>{
			if (!(fromDate instanceof Date) || !(tillDate instanceof Date)) {
				tillDate = new Date(Date.UTC(9999, 11, 30)); // overkill? Of course not, cez 8000 let bo ta app se vedno top shit
				fromDate = new Date(Date.UTC(1, 1, 1)); // i don't thunk so
			}

			var dataToBeSent = {
				"ctl00$ContentPlaceHolder1$edtDatZacetka": `${fromDate.getDay()}.${fromDate.getMonth()}.${fromDate.getFullYear()}`,
				"ctl00$ContentPlaceHolder1$edtDatKonca": `${tillDate.getDay()}.${tillDate.getMonth()}.${tillDate.getFullYear()}`,
			};
			this.postback(GSE_URL+"Page_Gim/Ucenec/IzostankiUcenec.aspx", dataToBeSent, null, true).then((response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");

				try {
					var rowElements = parsed.getElementById("ctl00_ContentPlaceHolder1_gvwIzostankiGroup").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
				} catch (err) {
					resolve(GSEC_NO_ABSENCES);
				}

				var absences = [];
			 	for (const izostanek of rowElements) {
					var subFields = izostanek.getElementsByTagName("td");
					var date = subFields[0].innerHTML.trim().split(".");
					var dateObj = new Date(Date.parse(`${date[2]}-${date[1]}-${date[0]}`));
					var subjects = {};

					for (const subject of subFields[2].innerHTML.split(", ")) {
						var subjectName = subject.split(" (")[0];
						var status = Number(subject.split('(<span class="opr').pop().split('">')[0]);
						// statusi so: 0: ni obdelano, 1: opravičeno, 2: neopravičeno, 3: ne šteje, uporabi S(gseAbsenceTypes[num]) za i18n pre3vod
						var period = Number(subject.split('">').pop().split('</span>')[0]);
						subjects[period] = {status: status, subject: subjectName};
					}
					absences.push({subjects: subjects, date: dateObj});
				}
				resolve(absences);
			});
		});
	}

	fetchGrades() {
		var grades = [];
		return new Promise((resolve, reject) => {
      		$.ajax({
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				url: GSE_URL + "Page_Gim/Ucenec/OceneUcenec.aspx",
				cache: false,
				type: "GET",
				dataType: "html",
				processData: false,

				success: (data, textStatus, xhr) => {

					let parser = new DOMParser();
					let parsed = parser.parseFromString(data, "text/html");

					let gradeSpans = parsed.getElementsByClassName("txtVOcObd");
					for (const grade of gradeSpans) {
						var ist = grade.getElementsByTagName("span")[0].getAttribute("title").split("\n");
						var date = ist[0].split(": ")[1].trim().split(".");
						var dateObj = new Date(Date.parse(date[2]+"-"+date[1]+"-"+date[0]));
						var teacher = ist[1].split(": ")[1].trim();
						var subject = ist[2].split(": ")[1].trim();
						var name = [];

						name.push(ist[3].split(": ")[1].trim())
						name.push(ist[4].split(": ")[1].trim())
						name.push(ist[5].split(": ")[1].trim())

						var gradeNumber = Number(grade.getElementsByTagName("span")[0].innerHTML);
						if (grade.getElementsByTagName("span")[0].classList.contains("ocVmesna")) {
							var temporary = true;
						} else {
							var temporary = false;
						}

						var gradeToAdd = {
							"date": dateObj,
							"teacher": teacher,
							"subject": subject,
							"name": name,
							"temporary": temporary,
							"grade": gradeNumber
						};

						if (grade.getElementsByTagName("span").length > 1) {
							if(grade.getElementsByTagName("span")[1].classList.contains("ocVmesna")) {
								gradeToAdd["temporary"] = true;
							} else {
								gradeToAdd["temporary"] = false;
							}
							gradeToAdd["grade"] = Number(grade.getElementsByTagName("span")[1].innerHTML);
							gradeToAdd["oldgrade"] = Number(grade.getElementsByTagName("span")[0].innerHTML);
						}
						grades.push(gradeToAdd);

					}
					resolve(grades);
				},
				error: () => {
					reject(new Error(GSEC_ERR_NET));
				}
      		});
		});
	}

	fetchMessageOld(selectId) { // ne dela, glej fix spodaj (fetchMessage)
		var message;
		return new Promise((resolve, reject) => {
			var dataToBeSent = {
				"__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila",
				"__EVENTARGUMENT": "Select$" + selectId
			};

			this.postback(GSE_URL+"Page_Gim/Uporabnik/Sporocila.aspx", dataToBeSent, null, true).then((response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				let subject = parsed.getElementsByClassName("msgSubjectS")[0].innerHTML.trim();
				let body = parsed.getElementsByClassName("gCursorAuto")[0].innerHTML.trim();
				let sender = parsed.querySelectorAll("[id$=Label7]")[0].innerHTML.split(" (")[0];
				let recipient = parsed.querySelectorAll("[id$=Label8]")[0].innerHTML;
				var date = parsed.querySelectorAll("[id$=Label7]")[0].innerHTML.split(" (").pop().split(" ")[0];
				var tume = parsed.querySelectorAll("[id$=Label7]")[0].innerHTML.split(" (").pop().split(")")[0].split(" ").pop(); // "tume"!
				var dateObj = new Date(Date.parse(date[2]+"-"+date[1]+"-"+date[0]+" "+tume)); // "tume"!
				var msgId = parsed.getElementById("ctl00_ContentPlaceHolder1_hfIdSporocilo").getAttribute("value");
				message = {
					"subject": subject,
					"body": body,
					"sender": sender,
					"recipient": recipient,
					"date": dateObj
				};
				resolve(message);
			});
		});
	}

	fetchMessagesLastPageNumber(category = GSEC_MSGTYPE_RECEIVED) {
		var msgCategory = GSEC_MSGTYPES[category];
		return new Promise((resolve, reject) => {
			var dataToBeSent = {
				"ctl00$ContentPlaceHolder1$ddlPrikaz": msgCategory,
				"__EVENTARGUMENT": "Page$Last",
				"__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila"
			};
			this.postback(GSE_URL+"Page_Gim/Uporabnik/Sporocila.aspx", dataToBeSent, null, true).then((response) => {
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				let currentPage;
				if(parsed.getElementsByClassName("pager").length == 0) { // pager is not shown, there is only page one.
					currentPage = 1;
				} else {
					currentPage = Number(parsed.getElementsByClassName("pager")[0].getElementsByTagName("span")[0].innerHTML);
				}
				resolve(currentPage);
			});
		});
	}

	fetchMessagesList(category = GSEC_MSGTYPE_RECEIVED, pageNumber = 1, outputResponse = false) { // outputResponse je probably za debug
		var msgCategory = GSEC_MSGTYPES[category];
		var messages = [];
		var requestURi = GSE_URL + "Page_Gim/Uporabnik/Sporocila.aspx";
		return new Promise((resolve, reject) => {
			var dataToBeSent = {
				"ctl00$ContentPlaceHolder1$ddlPrikaz": msgCategory,
				"__EVENTARGUMENT": "Page$" + pageNumber,
				"__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila"
			};
			this.postback(requestURi, dataToBeSent, null, true).then((response) => {
				if(outputResponse == true) {
					response.url = requestURi;
					resolve(response);
				}
				let parser = new DOMParser();
				let parsed = parser.parseFromString(response.data, "text/html");
				let messageElements = parsed.getElementById("ctl00_ContentPlaceHolder1_gvwSporocila").getElementsByTagName("tbody")[0].getElementsByTagName("td");
				for(const messageElement of messageElements) {
					let msgId = messageElement.getElementsByTagName("input")[0].value;
					var date = messageElement.getElementsByClassName("msgSubDate")[0].innerHTML.split(" ")[0].split(".");
					var today = new Date();
					if(date[2] == undefined || date[2].length < 1) {
						date[2] = today.getFullYear();
					}
					if(date[1] == undefined || date[1].length < 1) {
						date[1] = today.getMonth()+1;
						date[0] = today.getDate();
					}
					var tume = messageElement.getElementsByClassName("msgSubDate")[0].innerHTML.split(" ")[1];
					if (tume == undefined || tume == null) { // js nism kriv za to pizdraijo; gimsis je.
						tume = messageElement.getElementsByClassName("msgSubDate")[0].innerHTML;
					}
					var dateStringToParse = date[2]+"-"+date[1]+"-"+date[0]+" "+tume;
					var dateObj = new Date(Date.parse(dateStringToParse)); // "tume"!
					var person = messageElement.getElementsByClassName("msgDir")[0].innerHTML;
					var subject = messageElement.getElementsByClassName("msgSubject")[0].innerHTML;
					messages.push({"date": dateObj, "sender": person, "subject": subject, "msgId": msgId});
				}
				resolve(messages);
			});
		});
	}

	fetchMessage(category = GSEC_MSGTYPE_RECEIVED, pageNumber = 1, messageNumberOnPage = 0) {
		var message;
		return new Promise((resolve, reject) => {
			this.fetchMessagesList(category, pageNumber, true).then( (value) => {
				this.parseAndPost(
					value.data,
					{
						"__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila",
						"__EVENTARGUMENT": "Select$" + messageNumberOnPage
					},
					null, 
					value.url
				).then((response) => {

					let parser = new DOMParser();
					let parsed = parser.parseFromString(response.data, "text/html");
					let subject = parsed.getElementsByClassName("msgSubjectS")[0].innerHTML.trim();
					let body = parsed.getElementsByClassName("gCursorAuto")[0].innerHTML.trim();
					let sender = parsed.querySelectorAll("[id$=Label7]")[0].innerHTML.split(" (")[0];
					let recipient = parsed.querySelectorAll("[id$=Label8]")[0].innerHTML;
					var date = parsed.querySelectorAll("[id$=Label7]")[0].innerHTML.split(" (").pop().split(" ")[0].split(".");
					var tume = parsed.querySelectorAll("[id$=Label7]")[0].innerHTML.split(" (").pop().split(")")[0].split(" ").pop(); // "tume"!
					var dateObj = new Date(Date.parse(date[2]+"-"+date[1]+"-"+date[0]+" "+tume)); // "tume"!
					var msgId = parsed.getElementById("ctl00_ContentPlaceHolder1_hfIdSporocilo").getAttribute("value");
					message = {"subject": subject, "body": body, "sender": sender, "recipient": recipient, "date": dateObj, "msgId": msgId};
					resolve(message);
					
				});
			});
		});
	}
}
