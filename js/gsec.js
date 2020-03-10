// tab = 2 || any spaces; use tabs
const GSE_URL = "https://zgimsis.gimb.tk/gse/"
class gsec {
	constructor(gseuser = null, gsepass = null) {
		this.gseuser = gseuser;
		this.gsepass = gsepass;
	}
	postback(theUrl, params, formId = null) {
		return Promise( (resolve, reject) => {
			$.ajax({
				crossDomain: true,
				url: theUrl,
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
					var action = form.getAttribute("action"); // absolute url
					$.ajax({
						crossDomain: true,
						url: action,
						cache: false,
						type: "POST",
						dataType: "text",
						success: (postData) {
							resolve(postData);
						}
					});
				}
			});
		}
	}
}
