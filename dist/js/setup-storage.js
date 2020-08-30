async function setupStorage(force = false) {
	let logged_in;
	promises_check_if_already_installed = [
		localforage.getItem("logged_in").then(function (val) {
			console.log("[setupStorage] logged in status: " + val);
			logged_in = val;
		})
	];
	await Promise.all(promises_check_if_already_installed);

	let promises_update = [
		localforage.setItem("profile", {}),
		localforage.setItem("timetable", []),
		localforage.setItem("teachers", []),
		localforage.setItem("gradings", []),
		localforage.setItem("grades", []),
		localforage.setItem("absences", {}),
		localforage.setItem("messages", [[], [], []]), // see messages.js:129, commit 8eb9ca9caca30fbbe023243657535ab4088be377
		localforage.setItem("directory", {}), //\\ well I could remember my own code but I didn't.
		localforage.setItem("meals", {}),
		localforage.setItem("chosenLang", "en"),
		localforage.setItem("theme", "light"),
		localforage.setItem("errorReporting", "on"),
		localforage.setItem("lastUpdate", 0),
		localforage.setItem("triggerWarningAccepted", false)
	];

	if (logged_in && force == false) { // torej, če je že bila prijava narejena, ne posodobi backwards-compatible vrednosti (username, password,...)
		await Promise.all(promises_update);
		console.log("[setupStorage] user logged in: only updated");
	} else {

		let promises_first_install = [
			localforage.setItem("logged_in", false),
			localforage.setItem("username", ""),
			localforage.setItem("password", ""),
		];
		await localforage.clear();
		await Promise.all(promises_first_install);
		await Promise.all(promises_update);
		console.log("[setupStorage] user not logged in: set up whole database");
	}
}
