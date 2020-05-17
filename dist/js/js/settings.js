// settings.js -- TODO

async function setLanguage(langCode)  {
    localforage.setItem("chosenLang", langCode).then((value) => {
        console.log("Language set: " + value);
        UIAlert(D("languageSet"), "setLanguage(): languageSet");
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    $(".settings-language-selector").click(function () {
        let languageToSet = $(this).attr("data-language");
        setLanguage(languageToSet);
    });

    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });
});
