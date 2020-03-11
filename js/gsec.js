// tab = 2 || any spaces; use tabs
// not tested yet
function stripHtml(html) { // xss! itaK zaupamo zgimsisext responsem
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}
const GSE_URL = "https://zgimsis.gimb.tk/gse/";
class gsec {
	constructor() {
	}
	postback(getUrl, params = {}, formId = null) {
		return new Promise( (resolve, reject) => {
			$.ajax({
				crossDomain: true,
				url: getUrl,
				cache: false,
				type: "GET",
				dataType: "html",
				success: (getData) => {
					var parsed = document.createElement("html");
					parsed.innerHTML = getData;
					if(formId == null) {
						var form = parsed.getElementsByTagName("form")[0];
					} else {
						var form = parsed.getElementById(formId);
					}
					var otherParams = $(form).serializeArray();
					for(const input of otherParams) {
						if(!(input.name in params)) {
							params[input.name] = input.value; // so we don't overwrite existing values
						}
					}
					var action = new URL($(form).attr("action"), GSE_URL); // absolute == relative + base
					$.ajax({
						crossDomain: true,
						url: action,
						cache: false,
						type: "POST",
						data: params,
						dataType: "text",
						success: (postData, textStatus, xhr) => {
							resolve({data: postData, textStatus: textStatus, code: xhr.status});
						}
					});
				}
			});
		});
	}
	login(usernameToLogin, passwordToLogin) {
		return new Promise((resolve, reject) => {
		var dataToSend = {"edtGSEUserId": usernameToLogin, "edtGSEUserPassword": passwordToLogin, "btnLogin": "Prijava"};
			this.postback(GSE_URL+"Logon.aspx", dataToSend).then( (response) => {
				var parsed = document.createElement("html");
				parsed.innerHTML = response.data;
				if(response.code == 302) {
					resolve(true);
				} else {
					var simpleResponse = parsed.getElementById("lblMsg");
					if( simpleResponse = "Napaka pri prijavi.") {
						reject(new Error(false));
					} else {
						resolve(true);
					}
				}
			});
		});
	}
	fetchSessionData() {
		return new Promise((resolve, reject) => {
			$.ajax({
				crossDomain: true,
				url: GSE_URL+"WS_Gim/wsGimSisUtils.asmx",
				cache: false,
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				data: "{}",
				processData: false,
				success: (data, textStatus, xhr) => {
					resolve({"data": data.d, "textStatus": textStatus, "code": xhr.status});
				},
				error: () => {
					reject(new Error(false));
				}
			});
		}
	}
	fetchTeachersDirectory() {
		return new Promise((resolve, reject) => {
			var dejt = new Date();
			if(dejt.getMonth() < 7) { // če še ni avgust uporabimo preteklo leto/letnico
				var letnica = dejt.getFullYear()-1;
			} else { // je že po avgustu (september), uporabimo trenutno letnico
				var letnica = dejt.getFullYear();
			} // skratka uporabi se prvi sklop številk v šolskem letu TOLE(/xxxx)
			$.ajax({
				crossDomain: true,
				url: GSE_URL+"Page_Gim/Uporabnik/modSporociloPrejemniki.aspx/NajdiOsebePrejemniki",
				cache: false,
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify( { "aIdOsebeRe": "", "aIdSolskoLeto": Number(letnica).toString(), "aMsgType": "null", "aIdType": "null", "aIdUcitelj": "", "aFilter": null} ),
					// note about the nulls, "null"s and ""s: this is actually how zgimsisext2016 javascripts sends it.
				processData: false,
				success: (data, textStatus, xhr) => {
					resolve({"data": data.d, "textStatus": textStatus, "code": xhr.status});
				},
				error: () => {
					reject(new Error(false));
				}
			});
		});
	}
	fetchTimetable(datum = null) {
		if(datum == null) {
			var dataToSend = {};
		} else {
			var dataToSend = {"ctl00$ContentPlaceHolder1$wkgDnevnik_edtGridSelectDate": inputDate.getDate()+"."+Number(inputDate.getMonth()+1)+"."+inputDate.getFullYear()};
		}
		return new Promise((resolve, reject) => {
			var urnik = {};
			this.postback(GSE_URL+"Page_Gim/Ucenec/DnevnikUcenec.aspx", dataToSend).then( (response) => {
				var parsed = document.createElement("html");
				parsed.innerHTML = response.data;
				for(const urnikElement of $('[id^="ctl00_ContentPlaceHolder1_wkgDnevnik_btnCell_"]')) {
					var subFields = urnikElement.id.split("_");
					var period = subFields[4];
					var day = subFields[5];
					var desc = $(urnikElement).attr("title").split("/\r?\n/");
					var subject = desc[1].split('(').pop().split(')')[0]; // https://stackoverflow.com/a/27522597/11293716
					var abkurzung = desc[0].split(" (")[0];
					var razred = desc[2];
					var teacher = desc[3];
					var place = desc[4];
					urnik[day][period] = {"subject": subject, "acronym": abkurzung, "class": razred, "teacher":  teacher, "place": place};
				}
				resolve(urnik);
			});
		});
	}
	fetchGradings() {
		return new Promise((resolve, reject) => {
			var gradings = [];
			this.postback(GSE_URL+"Page_Gim/Ucenec/IzpitiUcenec.aspx").then( (response) => {
				var parsed = document.createElement("html");
				parsed.innerHTML = response.data;
				var rowElements = parsed.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0].getElementsByTagName("tr");
				for (const row of rowElements) {
					var subFields = row.getElementsByTagName("td");
					var date = subFields[0].innerHTML.trim().split(".");
					var dateObj = new Date(date[2]+"-"+date[1]+"-"+date[0]);
					var rowSpan = subFields[1].getElementsByTagName("span");
					var abkurzung = "";
					if(rowSpan) {
						abkurzung = rowSpan.innerHTML.trim();
					}
					rowSpan.remove(); // magic
					var subject = subFields[1].innerHTML.split(" (")[0].trim();
					var desc = subFields[1].innerHTML.split('(').pop().split(')')[0];
					gradings.push({"date": dateObj, "acronym": abkurzung, "subject": subject, "description": desc});
				}
				resolve(gradings);
			});
		});
	}
	fetchTeachers() {
		return new Promise((resolve, reject) => {
			var Teachers = {};
			this.postback(GSE_URL+"Page_Gim/Ucenec/UciteljskiZbor.aspx").then((response)=>{
				var parsed = document.createElement("html");
				parsed.innerHTML = response.data;
				var rowElements = parsed.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0].getElementsByTagName("tr");
				for(const row of rowElements) {
					var subFields = row.getElementsByTagName("td");
					var name = stripHtml(subFields[0].innerHTML); // razrednik je namreč bold tekst!
					var subjectStrings = subFields[2].innerHTML.split("<br />");
					for(const subjectString of subjectStrings) {
						// todo: https://github.com/sijanec/gimsisextclient/blob/master/main.php#L270
						var subjectName = 
					}
				}
			})
		});
	}
}
