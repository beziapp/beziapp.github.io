// there's an DoS backdoor in BežiApp because of this (-:<
var chosenLang;
var dateString = {
	day: (danv) => {
		let dnevitedna = [S("sunday"), S("monday"), S("tuesday"), S("wednesday"), S("thursday"), S("friday"), S("saturday")];
		return dnevitedna[danv];
	},
	month: (mesl) => {
		let mesecileta = [S("january"), S("february"), S("march"), S("april"), S("may"), S("june"), S("july"), S("august"), S("september"), S("october"), S("november"), S("december")];
		return mesecileta[mesl];
	},
	longFormatted: (dateObject) => {
		return `${dateString.day(dateObject.getDay())}, ${(dateObject.getDate())}. ${dateString.month(dateObject.getMonth())} ${dateObject.getFullYear()}`;
	}
};
async function refreshLangDOM() {
	let promises_to_runn = [
		localforage.getItem("chosenLang").then( (value) => {
			chosenLang = value;
		})
	];
	await Promise.all(promises_to_runn);
	// this could be done nicer. p. s.: lahko bi se uporablil x-s in x-S za razločitev med capitalize in !capitalize queryselectorall ni case sensitive za imena elementov
	let stringContainerss = document.querySelectorAll("x-sl:not(.langFinished)");
	for (i = 0; i < stringContainerss.length; i++) {
		stringContainerss[i].innerHTML = s(stringContainerss[i].innerHTML);
		stringContainerss[i].classList.add("langFinished");
		stringContainerss[i].hidden = false;
	}
	let stringContainersd = document.querySelectorAll("x-dl:not(.langFinished)");
	for (i = 0; i < stringContainersd.length; i++) {
		stringContainersd[i].innerHTML = d(stringContainersd[i].innerHTML);
		stringContainersd[i].classList.add("langFinished");
		stringContainersd[i].hidden = false;
	}
	let stringContainersS = document.querySelectorAll("x-su:not(.langFinished)");
	for (i = 0; i < stringContainersS.length; i++) {
		stringContainersS[i].innerHTML = S(stringContainersS[i].innerHTML);
		stringContainersS[i].classList.add("langFinished");
		stringContainersS[i].hidden = false;
	}
	let stringContainersD = document.querySelectorAll("x-du:not(.langFinished)");
	for (i = 0; i < stringContainersD.length; i++) {
		stringContainersD[i].innerHTML = D(stringContainersD[i].innerHTML);
		stringContainersD[i].classList.add("langFinished");
		stringContainersD[i].hidden = false;
	}
}
async function setLangConfigAndReload() {
	let promises_to_run = [
		/* localforage.setItem("chosenCapitalize", true), */ // F for unused code
		localforage.setItem("chosenLang", "en")
	];
	await Promise.all(promises_to_run);
	window.location.reload();
}
window.addEventListener("DOMContentLoaded", () => {
	find_chosen_lang();
});

async function find_chosen_lang() {
	let value = await localforage.getItem("chosenLang");
	if(value == null) {
		setLangConfigAndReload();
	} else {
		chosenLang = value;
	}
	refreshLangDOM();
}

const capitalize = (s) => {
	if (typeof s !== 'string') return ''
	return s.charAt(0).toUpperCase() + s.slice(1)
}
var s = function(whatString) {
	return getLang.s(whatString);
};
var d = function(whatString) {
	return getLang.d(whatString);
};
var S = function(whatString) {
	return getLang.S(whatString);
};
var D = function(whatString) {
	return getLang.D(whatString);
};
var getLang = { // language object
	s: function(whatString) { // get string
		return langstrings[chosenLang][whatString];
	},
	S: function(whatString) { // get capitalized string
		return capitalize(langstrings[chosenLang][whatString]);
	},
	d: function(whatString) { // add a dot and get string
		if(langstrings[chosenLang][whatString].slice(-1) != ".") {
			return langstrings[chosenLang][whatString]+".";
		} else {
			return langstrings[chosenLang][whatString];
		}
	},
	D: function(whatString) { // add a dot and get capitalized string
		if(langstrings[chosenLang][whatString].slice(-1) != ".") {
			return capitalize(langstrings[chosenLang][whatString]+".");
		} else {
			return capitalize(langstrings[chosenLang][whatString]);
		}
	},
}
var langstrings = {
	en: {
		miscTranslationLanguage: "English",
		miscTranslationAuthors: "Rok Štular",
		"": "",
		// date
		monday: "monday",
		tuesday: "tuesday",
		wednesday: "wednesday",
		thursday: "thursday",
		friday: "friday",
		saturday: "saturday",
		sunday: "sunday",
		am: "am",
		pm: "pm",
		january: "january",
		february: "february",
		march: "march",
		april: "april",
		may: "may",
		june: "june",
		july: "july",
		august: "august",
		september: "september",
		october: "october",
		november: "november",
		december: "december",
		// login
		username: "username",
		password: "password",
		signIn: "sign in",
		bySigningInYouAgreeTo: "by signing in, you agree to",
		theToS: "the terms and conditions",
		and: "and",
		thePrivacyPolicy: "the privacy policy",
		loginFailed: "login failed",
		browserNotSupported: "bežiapp won't work on your device, unless you update your Internet browser",
		// index
		timetable: "timetable",
		gradings: "gradings",
		grades: "grades",
		teachers: "teachers",
		absences: "absences",
		messaging: "messaging",
		meals: "meals",
		about: "about",
		logout: "logout",
		settings: "settings",
		// timetable
		noPeriods: "no periods in selected week",
		// gradings
		date: "date",
		description: "description",
		add: "add",
		requestFailed: "request failed",
		addGrading: "add grading",
		noInternetConnection: "no internet connection",
		// grades
		temporary: "temporary",
		useOnlyPermanentGrades: "use only permanent grades",
		useOnlyPermanentGradesNote1: "if checked, only permanent grades will be used in the average grade calculation",
		useOnlyPermanentGradesNote2: "if left unchecked, the calculation will include every available grade",
		type: "type",
		term: "term",
		teacher: "teacher",
		zakljucneGradess: "grades in red are final grades that appear on your end-of-year certificate and are decided by your teacher. They are not averages like grades in black. Should you have any questions or complaints about them, contact your teacher",
		// teachers
		name: "name",
		schoolSubject: "subject",
		tpMeetings: "TP meetings",
		// absences
		from: "from",
		to: "to",
		cancel: "cancel",
		ok: "ok",
		noAbsences: "no absences in the chosen time period",
		lesson: "lesson",
		notProcessed: "not processed",
		authorizedAbsence: "authorized",
		unauthorizedAbsence: "unauthorized",
		doesNotCount: "does not count",
		// messaging
		loadingMessages: "Loading messages...",
		sendAMessage: "send a message",
		send: "send",
		recipient: "recipient",
		messageSubject: "subject",
		messageBody: "message body",
		removeImages: "remove images",
		note: "note",
		largeImagesNote: "GimB servers don't like large messages, so only very small images may be attached or your message will not be delivered",
		attachedImages: "attached images",
		encryptMessage: "Encrypt message",
		passwordForE2EE: "password for encrypting the message",
		messages: "messages",
		received: "received",
		sent: "sent",
		deleted: "deleted",
		messageStorageUsed: "message storage used in this folder",
		maxMessagesNote: "you can only have 120 messages per message folder, older messages will not be shown. Remember to delete read and sent messages regulary to avoid any issues.",
		loadMessageBody: "load message body",
		thisMessageWasEncrypted: "this message was encrypted",
		enterPassword: "enter password",
		decrypt: "decrypt",
		nameDirectoryNotSet: "name directory not set, sending unavailable",
		errorFetchingMessages: "error fetching messages",
		unableToReceiveTheMessage: "unable to receive the message",
		unableToDeleteTheMessage: "unable to delete the message",
		messageWasProbablySent: "message was probably sent, check the Sent folder to be sure",
		errorSendingMessage: "error sending message",
		imageAddedAsAnAttachment: "image added as an attachment",
		unableToReadDirectory: "unable to read directory of people",
		messageCouldNotBeSent: "message could to be sent",
		incorrectPassword: "incorrect password",
		// chats
		chat: "chat",
		chattingWith: "chatting with",
		noMessages: "no messages",
		stillLoading: "loading is still in progress",
		directory: "directory",
		select: "select",
		mustSelectRecipient: "you have to select a recipient before chatting. Open directory on the left side by clicking on the top left addressbook button and select a recipient in order to start chatting with them",
		recipientNotInDirectory: "recipient is not in directory.",
		chatExternalInfo: "you have just received a chat. Chats are not supported by GimSIS, so you must reply by changing the subject to something else. Chat body: ",
		// meals
		loginError: "login error",
		loginToLopolis: "login to Lopolis",
		loginToLopolisNote: "it seems like you're not currently logged in to eRestavracija, so this form has been presented to you. You have a different username and password combination used for applying and opting out of of menus. In order to use this feature, you have to log in with your Lopolis account.",
		logInToLopolis: "log in to Lopolis",
		logOutFromLopolis: "log out from Lopolis",
		readOnly: "read only",
		usage: "usage",
		mealsUsageNote: "click on a date to open the collapsible menu with choices and click on a specific meal to select it. Reload the meals when you're done and check the entries.",
		lunchesNote: "app was not tested with lunches in mind. Meals probably won't work with lunches and having a lunch subscription may even break its functionality.",
		mealNotShownNote: "editable meals are highlighted in gold, read-only meals are highlighted in grey and cannot be changed. Meals that provide no options for menus are not shown for clarity, same applies for days where there are no meals",
		mealsContributeNote: "you are welcome to contribute to the LopolisAPI project and add features, such as checkouts.",
		authenticationError: "authentication error",
		lopolisAPIConnectionError: "LopolisAPI server connection error",
		errorGettingMenus: "error getting menus",
		errorUnexpectedResponse: "error: unexpected response",
		requestForAuthenticationFailed: "request for authentication failed",
		credentialsMatch: "credentials match",
		errorSettingMeals: "error setting meals",
		mealSet: "meal set! Reload meals to be sure",
		selected: "selected",
		meal: "meal",
		checkedOut: "checked out",
		checkedIn: "checked in",
		successfulCheckingInOut: "successfully checked in/out",
		errorCheckingInOut: "failed to check in/out",
		// about
		version: "version",
		authors: "authors",
		translatorsForThisLanguage: "translators for this language",
		whatIsNew: "what's new",
		whatsNew: "what's new",
		reportABug: "report a bug",
		sendASuggestion: "send a suggestion",
		instagram: "instagram",
		// changelog
		changelog: "changelog",
		// terms and conditions
		termsOfUse: "terms of use",
		termsOfUseDescription: "as a condition of use, you promise not to use the BežiApp (App or application) and its related infrastructure (API, hosting service) for any purpose that is unlawful or prohibited by these Terms, or any other purpose not reasonably intended by the authors of the App. By way of example, and not as a limitation, you agree not to use the App",
		termsOfUseHarass: "to abuse, harass, threaten, impersonate or intimidate any person",
		termsOfUsePost: "to post or transmit, or cause to be posted or transmitted, any Content that is libelous, defamatory, obscene, pornographic, abusive, offensive, profane or that infringes any copyright or other right of any person",
		termsOfUseCommunicate: "to communicate with the App developers or other users in abusive or offensive manner",
		termsOfUsePurpose: "for any purpose that is not permitted under the laws of the jurisdiction where you use the App",
		termsOfUseExploit: "to post or transmit, or cause to be posted or transmitted, any Communication designed or intended to obtain password, account or private information of any App user",
		termsOfUseSpam: "to create or transmit unwanted “spam” to any person or any URL",
		termsOfUseModify: "you may also not reverse engineer, modify or redistribute the app without written consent from the developers",
		terminationOfServices: "termination of services",
		terminationOfServicesDescriptions: "the developers of the App may terminate your access to the App without any prior warning or notice for any of the following reasons",
		terminationOfServicesBreaching: "breaching the Terms of Service",
		terminationOfServicesRequest: "receiving a formal request from authorities of Gimnazija Bežigrad administration requesting termination of your access to the App",
		limitationOfLiability: "limitation of Liability",
		limitationOfLiabilityContent: "the developers of the App provide no warranty; You expressly acknowledge and agree that the use of the licensed application is at your sole risk. To the maximum extent permited by applicable law, the licensed application and any services performed of provided by the licensed application are provided “as is” and “as available”, with all faults and without warranty of any kind, and licensor hereby disclaims all warranties and conditions with respect to the licensed application and any services, either express, implied or statutory, including, but not limited to, the implied warranties and/or conditions of merchantability, of satisfactory quality, of fitness for a particular purpose, of accuracy, of quiet enjoyment, and of noninfringement of third-party rights. No oral or written information or advice given by licensor or its authorized representative shall create a warranty. Should the licensed application or services prove defective, you assume the entire cost of all necessary servicing, repair or correction. Some jurisdictions do not allow the exclusion of the implied warranties or limitations on applicable statutory rights of a customer, so the above exclusion may not apply to you.",
		tosAreEffectiveAsOf: "the Terms of Service are effective as of",
		// privacy policy
		privacyImportant: "your privacy is important to us. It is the developers' policy to respect your privacy regarding any information we may collect from you through our app, BežiApp.",
		privacyOnlyAskedWhen: "we only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.",
		privacyDataCollection: "we only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.",
		privacySharingData: "we don’t share any personally identifying information publicly or with third-parties, except when required to by law",
		privacyExternalSites: "our app may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.",
		privacyRefuse: "you are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.",
		privacyAcceptWithUse: "your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.",
		privacyEffectiveAsOf: "this policy is effective as of",
		// settings
		language: "language",
		selectLanguage: "select desired language",
		languageSet: "language set, open another page for the changes to take effect",
		theme: "theme",
		themeLight: "light theme (default)",
		themeDark: "dark theme",
		themeNight: "night theme",
		selectTheme: "select a theme",
		triggerWarning: "the following switch enables additional settings, which some people may: disagree with, find annoying, be offended by them. By enabling the switch, you agree that you won't be triggered by any of the additional options and will not asociate any of the authors and/or their personal beliefs and opinions with additional options.",
		triggerAgreement: "i agree with terms and conditions stated above",
		triggerWarningSet: "additional settings toggled",
		additionalOptions: "additional settings",
		themeSet: "theme set, open another page for the changes to take effect",
		errorReportingSet: "error reporting preference set",
		errorReporting: "error reporting",
		on: "on",
		off: "off",
		selectErrorReporting: "should error reports be submitted to the developers?",
		// gsec
		gsecErrNet: "GimSIS connection error",
		gsecErrLogin: "GimSIS login error (bad password?), try logging out",
		gsecErrOther: "GimSIS unknown error, try logging out",
		// videoconferences
		videoconferences: "GimB meet"
	},
	sl: {
		miscTranslationLanguage: "slovenščina",
		miscTranslationAuthors: "Anton Luka Šijanec",
		"": "",
		// date
		monday: "ponedeljek",
		tuesday: "torek",
		wednesday: "sreda",
		thursday: "četrtek",
		friday: "petek",
		saturday: "sobota",
		sunday: "nedelja",
		am: "dop.",
		pm: "pop.",
		january: "januar",
		february: "februar",
		march: "marec",
		april: "april",
		may: "maj",
		june: "junij",
		july: "julij",
		august: "avgust",
		september: "september",
		october: "oktober",
		november: "november",
		december: "december",
		// login
		username: "uporabniško ime",
		password: "geslo",
		signIn: "prijava",
		bySigningInYouAgreeTo: "s prijavo se strinjate s",
		theToS: "pogoji uporabe (v angleščini)",
		and: "in",
		thePrivacyPolicy: "politika zasebnosti (v angleščini)",
		loginFailed: "prijava je spodletela",
				browserNotSupported: "BežiApp ne bo deloval na vaši napravi, če ne posodobite vašega Internetnega brskalnika",
		// timetable
		noPeriods: "ni ur v izbranem tednu",
		// index
		timetable: "urnik",
		gradings: "ocenjevanja",
		grades: "ocene",
		teachers: "profesorji",
		absences: "izostanki",
		messaging: "sporočanje",
		meals: "obroki",
		about: "o",
		logout: "odjava",
		settings: "nastavitve",
		// gradings
		date: "datum",
		description: "opis",
		add: "dodaj",
		requestFailed: "zahteva spodletela",
		addGrading: "dodaj ocenjevanje",
		noInternetConnection: "ni povezave s spletom",
		// grades
		temporary: "začasno",
		useOnlyPermanentGrades: "uporabi le stalne ocene",
		useOnlyPermanentGradesNote1: "če je označeno, bodo za izračun povprečja uporabljene le stalne ocene",
		useOnlyPermanentGradesNote2: "če pa je polje neoznačeno, pa se ob izračunu povprečne ocene upoštevajo vse ocene",
		type: "tip",
		term: "rok",
		teacher: "profesor",
		zakljucneGradess: "zaključne ocene, ki bodo na spričevalu, so označene z rdečo, povprečja ocen pa so v črni barvi. V kolikor imate kakršnekoli pritožbe ali vprašanja glede zaključnih ocen, povprašajte profesorja",
		// teachers
		name: "ime",
		schoolSubject: "predmet",
		tpMeetings: "govorilne ure",
		// absences
		from: "od",
		to: "do",
		cancel: "prekliči",
		ok: "v redu",
		noAbsences: "ni izostankov v izbranem časovnem obdobju",
		lesson: "ura",
		notProcessed: "ni obdelano",
		authorizedAbsence: "opravičeno",
		unauthorizedAbsence: "neopravičeno",
		doesNotCount: "ne šteje",
		// messaging
		loadingMessages: "Nalagam sporočila...",
		sendAMessage: "pošlji sporočilo",
		send: "pošlji",
		recipient: "prejemnik",
		messageSubject: "zadeva",
		messageBody: "telo",
		removeImages: "odstrani slike",
		note: "opomba",
		largeImagesNote: "GimB strežniki ne marajo velikih sporočil, zato lahko pošiljate le zelo majhne slike, v nasprotnem primeru sporočilo ne bo dostavljeno",
		attachedImages: "pripete slike",
		encryptMessage: "Šifriraj sporočilo",
		passwordForE2EE: "geslo za šifriranje sporočila",
		messages: "sporočila",
		received: "prejeta",
		sent: "poslana",
		deleted: "izbrisana",
		messageStorageUsed: "zasedenost shrambe sporočil v tej mapi",
		maxMessagesNote: "v vsaki mapi imate lahko največ 120 sporočil. Starejša sporočila ne bodo prikazana. Redno brišite sporočila, da se izognete morebitnim težavam.",
		loadMessageBody: "naloži telo sporočila",
		thisMessageWasEncrypted: "to sporočilo je šifrirano",
		enterPassword: "vnesite geslo",
		decrypt: "dešifriraj",
		nameDirectoryNotSet: "imenik ni nastavljen, pošiljanje ni mogoče",
		errorFetchingMessages: "sporočil ni bilo mogoče prenesti",
		unableToReceiveTheMessage: "sporočila ni bilo mogoče prenesti",
		unableToDeleteTheMessage: "sporočila ni bilo mogoče izbrisati",
		messageWasProbablySent: "sporočilo je bilo verjetno poslano, prepričajte se in preverite mapo s poslanimi sporočili",
		errorSendingMessage: "sporočila ni bilo mogoče poslati",
		imageAddedAsAnAttachment: "slika dodana kot priloga",
		unableToReadDirectory: "imenika ni bilo mogoče prebrati",
		messageCouldNotBeSent: "sporočila ni bilo mogoče poslati",
		incorrectPassword: "nepravilno geslo",
		// chats
		chat: "klepet",
		chattingWith: "klepet z osebo",
		noMessages: "ni sporočil",
		stillLoading: "nalaganje še poteka",
		directory: "imenik",
		select: "izberi",
		mustSelectRecipient: "pred klepetom morate izbrati sogovornika. Odprite imenik (meni na levi strani) s pritiskom na gumb \"imenik\" zgoraj desno in izberite sogovornika.",
		recipientNotInDirectory: "izbrane osebe ni v imeniku",
		chatExternalInfo: "dobili ste kratko sporočilo v standardu, ki ga GimSIS ne podpira. Pri odgovarjanju spremenite zadevo. Vsebina sporočila: ",
		// meals
		loginError: "napaka pri prijavi",
		loginToLopolis: "prijava v Lopolis",
		loginToLopolisNote: "izgleda, da niste prijavljeni v eRestavracijo, zato se vam je prikazal prijavni obrazec. Za uporavljanje s prehrano se uporablja druga kombinacija uporabniškega imena in gesla, zato se prijavite s svojimi Lopolis prijavnimi podatki za nadaljevanje.",
		logInToLopolis: "prijava v Lopolis",
		logOutFromLopolis: "odjava iz Lopolisa",
		readOnly: "samo za branje",
		usage: "uporaba",
		mealsUsageNote: "kliknite na datum za prikaz menijev, nato pa si enega izberite s klikom na ime menija. Po nastavitvi menijev ponovno naložite menije in se prepričajte o pravilnih nastavitvah.",
		lunchesNote: "aplikacija ni testirana za naročanje na kosila, zato verjetno to ne deluje. Če ste naročeni na kosila lahko naročanje na menije sploh ne deluje ali pa deluje narobe.",
		mealNotShownNote: "obroki, označeni z zlato so nastavljivi, tisti, označeni s sivo, niso, če pa pri kakšnem dnevu obroka ni, pa pomeni, da ga ni moč nastaviti ali pa da ne obrok ne obstaja",
		mealsContributeNote: "vabimo vas k urejanju LopolisAPI programa za upravljanje z meniji.",
		authenticationError: "napaka avtentikacije",
		lopolisAPIConnectionError: "napaka povezave na LopolisAPI strežnik",
		errorGettingMenus: "napaka branja menijev",
		errorUnexpectedResponse: "napaka: nepričakovan odgovor",
		requestForAuthenticationFailed: "zahteva za avtentikacijo ni uspela",
		credentialsMatch: "prijavni podatki so pravilni",
		errorSettingMeals: "napaka pri nastavljanju menijev",
		mealSet: "obrok nastavljen! osvežite obroke in se prepričajte sami",
		selected: "izbrano",
		meal: "obrok",
		checkedOut: "odjavljen",
		checkedIn: "prijavljen",
		errorCheckingInOut: "prijava/odjava na obrok NI uspela",
		successfulCheckingInOut: "prijava/odjava na obrok je uspela",
		// about
		version: "različica",
		authors: "avtorji",
		translatorsForThisLanguage: "prevajalci izbranega jezika",
		whatIsNew: "kaj je novega",
		whatsNew: "kaj je novega",
		reportABug: "prijavite napako",
		sendASuggestion: "pošljite pripombo/predlog/pohvalo/pritožbo",
		instagram: "instagram",
		// changelog
		changelog: "dnevnik sprememb",
		// terms and conditions
		termsOfUse: "terms of use",
		termsOfUseDescription: "as a condition of use, you promise not to use the BežiApp (App or application) and its related infrastructure (API, hosting service) for any purpose that is unlawful or prohibited by these Terms, or any other purpose not reasonably intended by the authors of the App. By way of example, and not as a limitation, you agree not to use the App",
		termsOfUseHarass: "to abuse, harass, threaten, impersonate or intimidate any person",
		termsOfUsePost: "to post or transmit, or cause to be posted or transmitted, any Content that is libelous, defamatory, obscene, pornographic, abusive, offensive, profane or that infringes any copyright or other right of any person",
		termsOfUseCommunicate: "to communicate with the App developers or other users in abusive or offensive manner",
		termsOfUsePurpose: "for any purpose that is not permitted under the laws of the jurisdiction where you use the App",
		termsOfUseExploit: "to post or transmit, or cause to be posted or transmitted, any Communication designed or intended to obtain password, account or private information of any App user",
		termsOfUseSpam: "to create or transmit unwanted “spam” to any person or any URL",
		termsOfUseModify: "you may also not reverse engineer, modify or redistribute the app without written consent from the developers",
		terminationOfServices: "termination of services",
		terminationOfServicesDescriptions: "the developers of the App may terminate your access to the App without any prior warning or notice for any of the following reasons",
		terminationOfServicesBreaching: "breaching the Terms of Service",
		terminationOfServicesRequest: "receiving a formal request from authorities of Gimnazija Bežigrad administration requesting termination of your access to the App",
		limitationOfLiability: "limitation of Liability",
		limitationOfLiabilityContent: "the developers of the App provide no warranty; You expressly acknowledge and agree that the use of the licensed application is at your sole risk. To the maximum extent permited by applicable law, the licensed application and any services performed of provided by the licensed application are provided “as is” and “as available”, with all faults and without warranty of any kind, and licensor hereby disclaims all warranties and conditions with respect to the licensed application and any services, either express, implied or statutory, including, but not limited to, the implied warranties and/or conditions of merchantability, of satisfactory quality, of fitness for a particular purpose, of accuracy, of quiet enjoyment, and of noninfringement of third-party rights. No oral or written information or advice given by licensor or its authorized representative shall create a warranty. Should the licensed application or services prove defective, you assume the entire cost of all necessary servicing, repair or correction. Some jurisdictions do not allow the exclusion of the implied warranties or limitations on applicable statutory rights of a customer, so the above exclusion may not apply to you.",
		tosAreEffectiveAsOf: "the Terms of Service are effective as of",
		// privacy policy
		privacyImportant: "your privacy is important to us. It is the developers' policy to respect your privacy regarding any information we may collect from you through our app, BežiApp.",
		privacyOnlyAskedWhen: "we only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.",
		privacyDataCollection: "we only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.",
		privacySharingData: "we don’t share any personally identifying information publicly or with third-parties, except when required to by law",
		privacyExternalSites: "our app may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.",
		privacyRefuse: "you are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.",
		privacyAcceptWithUse: "your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.",
		privacyEffectiveAsOf: "this policy is effective as of",
		// settings
		language: "jezik",
		selectLanguage: "izberite željen jezik",
		languageSet: "jezik nastavljen, odprite neko drugo stran da se pokažejo spremembe",
		theme: "izgled",
		themeLight: "svetel izgled (privzeto)",
		themeDark: "temen izgled",
		themeNight: "nočni izgled",
		themeSet: "izgled nastavljen, odprite neko drugo stran da se spremembe uveljavijo",
		selectTheme: "izberite željen izgled",
		errorReportingSet: "nastavitev pošiljanja napak izbrana",
		errorReporting: "pošiljanje napak",
		on: "vklopljeno",
		off: "izklopljeno",
		selectErrorReporting: "ali naj so napake v aplikaciji posredovane razvijalcem?",
		triggerWarning: "spodnji gumb omogoči dodatne možnosti, ki lahko razburijo/vznevoljijo nekatere uporabnike. Če omogočite stikalo, se strinjate, da avtorjev in/ali njihovih osebnih prepričanj ne boste povezovali s katerokoli od dodatnih omogočenih možnosti",
		triggerAgreement: "strinjam se z zgoraj navedenimi pogoji",
		triggerWarningSet: "spremenili ste stanje dodatnih nastavitev",
		additionalOptions: "dodatne nastavitve",
		// gsec
		gsecErrNet: "napaka povezave na GimSIS",
		gsecErrLogin: "prijava v GimSIS ni uspela (napačno geslo?), poskusite se odjaviti",
		gsecErrOther: "neznana napaka GimSISa, poskusite se odjaviti",
		// videoconferences
		videoconferences: "GimB konference"
	}
}
