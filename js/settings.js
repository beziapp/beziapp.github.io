// settings.js -- TODO

async function setLanguage(langCode)  {
	localforage.setItem("chosenLang", langCode).then( () => {
		UIAlert(D("languageSet"), "setLanguage(): languageSet");
	});
}

document.addEventListener("DOMContentLoaded", async () => {
	$(document).on("click",".settings-language-selector", function () {
		let languageToSet = $(this).attr('data-language');
		setLanguage(languageToSet);
	});
	// Setup side menu
	const menus = document.querySelectorAll(".side-menu");
	M.Sidenav.init(menus, { edge: "right", draggable: true });
});
