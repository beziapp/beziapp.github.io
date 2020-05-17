// settings.js -- TODO

async function setLanguage(langCode)  {
    localforage.setItem("chosenLang", langCode).then((value) => {
        console.log("Language set: " + value);
        UIAlert(D("languageSet"), "setLanguage(): languageSet");
    });
}

document.addEventListener("DOMContentLoaded", async () => {

    $("#select-language").on("change", () => {
        let languageToSet = $(this).find(":selected").data("language");
        setLanguage(languageToSet);
    });

    localforage.getItem("chosenLang").then((value) => {
        let selectedLanguage = value ?? "sl";
        $(`#option-${selectedLanguage}`).attr("selected", true);
    }).catch(() => {});

    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });

    // Setup language select dropdown
    var elems = document.querySelectorAll('select');
    M.FormSelect.init(elems, {});
});
