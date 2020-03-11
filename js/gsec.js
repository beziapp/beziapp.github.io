// tab = 2 || any spaces; use tabs
const GSE_URL = "https://zgimsis.gimb.tk/gse/";
class gsec {
	constructor() {
	}
	postback(getUrl, params, formId = null) {
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
						success: (postData) => {
							resolve(postData);
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
				parsed.innerHTML = response;
				var simpleResponse = parsed.getElementById("lblMsg");
					if( simpleResponse = "Napaka pri prijavi.") {
						reject(new Error(false));
					} else {
						resolve(true);
					}
			});
		});
	}
}
