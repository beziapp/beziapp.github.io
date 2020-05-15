// const API_ENDPOINT = "https://gimb.tk/test.php";
const DIRECTORY_URL = "/directory.json";

// "Global" object for name directory
var directory = null;
var currentlyChattingWith = null; // msgid
var sogovornik = null; // name
var firstPageOfMessages = null; // so we can test if new messages ever arrive

async function checkLogin() {
    localforage.getItem("logged_in").then(function (value) {
        // This code runs once the value has been loaded
        // from the offline store.
        if (value !== true) {
            window.location.replace("/index.html");
        }
    }).catch(function (err) {
        // This code runs if there were any errors
        console.log(err);
    });
}

function getKeyByValue(object, value) {
  	return Object.keys(object).find(key => object[key] === value);
}

// -----------HTML HELPERS-----------
function htmlEncode(value) {
    // Create a in-memory element, set its inner text (which is automatically encoded)
    // Then grab the encoded contents back out. The element never exists on the DOM.
    return $("<textarea/>").text(value).html();
}

function htmlDecode(value) {
    return $("<textarea/>").html(value).text();
}
// ---------------------------------

// Try to fetch name:id directory
function loadDirectory() {
    $.ajax({
        url: DIRECTORY_URL,
        crossDomain: true,

        dataType: "json",
        cache: false,
        type: "GET",

        success: (data) => {
            // If we were able to retrieve it, update the saved directory
            localforage.setItem("directory", data);
            directory = data;
            // Populate autocomplete
            populateAutocomplete();
        },

        error: () => {
            // Otherwise, try to retrieve stored directory
            localforage.getItem("directory").then((stored_directory) => {
                if (stored_directory === null) {
                    // If unable, set directory to null (so other functions know that we don't have it)
					UIAlert( D("nameDirectoryNotSet"), "loadDirectory(): stored_directory === null" );
                    directory = null;
                    // Disable send button
                    $("#msg-send").prop("disabled", true);
                } else {
                    directory = stored_directory;
                    // Populate autocomplete
                    populateAutocomplete();
                }
            });
        }
    });
}

function populateAutocomplete() {
    let elems = document.querySelectorAll('.autocomplete-fullname');
    // če se uporablja globalna var directory, ki je shranjena kot objekt (vedno shranjen kot reference), bo pri let x=y x le pointer na object y
    // in se bo spremenil z spremembo "originala". spodnja stvar itak ni preveč efficent, loop čez vseh 7000 ljudi bi lahko delal težave...
    // kakšen Object.keys bi bila boljša varianta ampak raje napišem tale komentar... idk, to se mi je zdelo uporabno ampak sedaj obžalujem
    // samo guglal sem "copying an object js"
	let autocomplete_entries = Object.assign({}, directory);
    for (let variableKey in autocomplete_entries) {
        autocomplete_entries[variableKey] = null;
	}

    M.Autocomplete.init(elems, {
        data: autocomplete_entries,
        onAutocomplete: validateName,
        minLength: 0
	});

    if (window.location.hash.length > 1) {
    	document.getElementById("full-name").value = decodeURIComponent(window.location.hash.substring(1));
    } else {
    	document.getElementById("full-name").value = getUrlParameter("m");
	}

    M.updateTextFields();
    validateName();
}

// Function to toggle loading bar
function setLoading(state) {
    if (state) {
        $("#loading-bar").removeClass("hidden");
    } else {
        $("#loading-bar").addClass("hidden");
    }
}

async function sendMessage(recipient_number = null, body = null) {
	// == catches null & undefined
	if (recipient_number == null) {
		recipient_number = directory[sogovornik];
	}
	if (body == null) {
		body = document.getElementById("msg-body").value;
	}
	if (body.length > 180) {
		throw new RangeError("sendMessage(): message is longer than 180 characters.");
	}
	let promises_to_run = [
		localforage.getItem("username").then((value) => {
			username = value;
		}),
		localforage.getItem("password").then((value) => {
			password = value;
		}),
	];
	setLoading(true);
	Promise.all(promises_to_run).then(() => {
		try {
			let gsecInstance = new gsec();
			gsecInstance.login(username, password).then( () => {
				gsecInstance.sendMessage(recipient_number, "ba-ctlmsg-chat-" + body, "BežiApp chat: " + body).then((value) => {
					addMessage(0, body);
					setLoading(false);
				}).catch((err) => {
					gsecErrorHandlerUI(err);
					setLoading(false);
				});
			});
		} catch (err) {
			gsecErrorHandlerUI(err);
			setLoading(false);
		}
	});
}

function addMessage(whom, body, datePlacement = 0, messageDate = null) { // datePlacement: 0=append bubble to end, 1=append bubble to start.
	if (whom == 0) {
		var whos = "mine";
	} else {
		var whos = "yours";
	}

	var timestamp = Date.now();
	if (messageDate instanceof Date) {
		timestamp = messageDate.getTime();
	}

	if (typeof messageDate == "number") {
		timestamp = messageDate;
	}

	var chatarea = document.getElementsByClassName("chat")[0];
	var alreadyMessages = chatarea.querySelectorAll(".message");
	var textnode = document.createTextNode(body); 

	var bubblenode = document.createElement("div");
	bubblenode.setAttribute("data-date", timestamp);
	bubblenode.appendChild(textnode);

	if (chatarea.childElementCount == 0) {
		bubblenode.className = "message last";
		var messagesnest = document.createElement("div");
		var istaoseba = false;
	} else {

		if (datePlacement == 0 || timestamp > Number(alreadyMessages[alreadyMessages.length - 1].getAttribute("data-date"))) {

			datePlacement = 0;
			console.log(alreadyMessages[0].getAttribute("data-date"));
			bubblenode.className = "message last";
			if (chatarea.children.item(chatarea.children.length - 1).classList.contains(whos)) { // ista oseba
				var istaoseba = true;
				var messagesnest = chatarea.children.item(chatarea.children.length - 1);
				messagesnest.children.item(messagesnest.children.length - 1).classList.remove("last");
			} else {
				var istaoseba = false;
				var messagesnest = document.createElement("div");
			}

		} else if (datePlacement == 1 || timestamp < Number(alreadyMessages[0].getAttribute("data-date"))) {

			datePlacement = 1;
			console.log(alreadyMessages[0].getAttribute("data-date"));
			if(chatarea.children.item(0).classList.contains(whos)) { // ista oseba
				bubblenode.className = "message";
				var istaoseba = true;
				var messagesnest = chatarea.children.item(0);
			} else {
				bubblenode.className = "message last";
				var istaoseba = false;
				var messagesnest = document.createElement("div");
			}

		} else { // auto place (slower, so 0 or 1 are options

			console.log("if3");
			for (var iter = 0; iter < alreadyMessages.length - 2; iter++) { // (-2 zato, ker potem iter+1 ne obstaja pri zadnjem elementu)
				if (Number(alreadyMessages[iter].getAttribute("data-date")) < timstamp
					&& Number(alreadyMessages[iter+1].getAttribute("data-date")) > timestamp) {

					var zgornjiIsti = alreadyMessages[iter].parentElement.classList.contains(whos);
					var spodnjiIsti = alreadyMessages[iter+1].parentElement.classList.contains(whos);
					console.log([zgornjiIsti, spodnjiIsti]);

					if (zgornjiIsti && spodnjiIsti) {
						var messagesnest = alreadyMessages[iter].parentElement;
						bubblenode.className = "message";
						messagesnest.insertBefore(bubblenode, alreadyMessages[iter+1]);
						return;
					}

					if (zgornjiIsti && !spodnjiIsti) {
						var messagesnest = alreadyMessages[iter].parentElement;
						bubblenode.className = "message last";
						messagesnest.children.item(messagesnest.childElementCount - 1).classList.remove("last");
						messagesnest.appendChild(bubblenode);
						return;
					}

					if (!zgornjiIsti && spodnjiIsti) {
						var messagesnest = alreadyMessages[iter+1].parentElement;
						bubblenode.className = "message";
						messagesnest.insertBefore(bubblenode, alreadyMessages[iter+1]);
						return;
					}

					throw new RangeError("This should not happen!");
				}
			}
			throw new RangeError("This should not happen!1");

		}
	}

	// autodetect date is not present here anymore
	messagesnest.className = whos + " messages";
	if (datePlacement == 0) {
		messagesnest.appendChild(bubblenode);
	} else {
		messagesnest.prepend(bubblenode);
	}

	if (!istaoseba) {
		if (datePlacement == 0) {
			chatarea.appendChild(messagesnest);
		} else{
			chatarea.prepend(messagesnest);
		}
	}
}

async function validateName() {
	if (directory !== null) {
		$("#full-name").prop("disabled", false);
		if ($("#full-name").val() in directory) {
			$("#full-name").addClass("valid");
			$("#full-name").removeClass("invalid");
			$("#chat-recipient-select-btn").prop("disabled", false);
			$("#msg-body").prop("disabled", false);
		} else {
			$("#full-name").addClass("invalid");
			$("#full-name").removeClass("valid");
			$("#chat-recipient-select-btn").prop("disabled", true);
			$("#msg-body").prop("disabled", true);
			$("#msg-body").val("");
		}
	} else {
		$("#chat-recipient-select-btn").prop("disabled", true);
		$("#full-name").val(D("nameDirectoryNotSet"));
		$("#full-name").prop("disabled", true);
		$("#msg-body").val("");
	}
}

async function clearMessages() {
	$(".chat").eq(0).html("");
}

function getUrlParameter(sParam) {
	const url_params = new URLSearchParams(window.location.search);
	const found_param = url_params.get(sParam);
	return found_param;
}

document.addEventListener("DOMContentLoaded", () => {
	checkLogin();
	loadDirectory();
	updateSendButton();

	// var receivedmessages = null;

	M.updateTextFields();
	// Setup side menu
	const menus = document.querySelectorAll(".side-menu");
	M.Sidenav.init(menus, { edge: "right", draggable: true });
	let elems = document.querySelectorAll(".modal");
	let instances = M.Modal.init(elems, {});
	// Setup side modal
	const modals = document.querySelectorAll(".side-modal");
	M.Sidenav.init(modals, { edge: "left", draggable: false });
	prepareAndStartFetchingMessages(); // just opens modal, as there is no recipient selected
});

async function updateSendButton() {
	if ($("#msg-body").val().length == 0) {
		$("#msg-send").prop("disabled", true);
	} else {
		$("#msg-send").prop("disabled", false);
	}
}

async function setRecipient(name = null) {
	if (name == null || name == false || name == undefined) {
		name = $("#full-name").val();
	} else if (typeof name != "number") {
		throw new TypeError('Hello from setRecipient(): name can only be string or null!');
	}

	if (Object.keys(directory).includes(name)) {} else {
		UIAlert(D("recipientNotInDirectory"));
		throw new RangeError("Hello from setRecipient(): name is not in directory");
	}

	var modal = document.querySelectorAll("#directory-side-menu")[0];
	var modalInstance = M.Sidenav.getInstance(modal);
	modalInstance.close();

	$(".msg-chattingWith").eq(0).html(name);
	sogovornik = name;
	currentlyChattingWith = directory[name];

	$("#chat-mustSelectRecipient").hide();

	updateSendButton();
	clearMessages(); // <-- do when recipient selected
	prepareAndStartFetchingMessages(); // <-- same
}

async function prepareAndStartFetchingMessages() {
	if (currentlyChattingWith === 0 || (currentlyChattingWith >= 1 && currentlyChattingWith < 69420)) {
		$("#msg-body").prop("disabled", false);
		await clearMessages();
		startFetchingMessages();
	} else {
		var modal = document.querySelectorAll("#directory-side-menu")[0];
		var modalInstance = M.Sidenav.getInstance(modal);
		modalInstance.open();
	}
}

async function startFetchingMessages() {
	let promises_to_run = [
		localforage.getItem("username").then((value) => {
			username = value;
		}),
		localforage.getItem("password").then((value) => {
			password = value;
		}),
	];

	setLoading(true);
	await Promise.all(promises_to_run);
	try {
		let gsecInstance = new gsec();
		await gsecInstance.login(username, password);
		for (var category = 0; category <= 1; category++) {
			let lastpage = await gsecInstance.fetchMessagesLastPageNumber(category);
			startLoadingMessagesForCategory(gsecInstance, category, lastpage);
		}
	} catch (err) {
		gsecErrorHandlerUI(err);
	}
	setLoading(false);
}

async function startLoadingMessagesForCategory(gsecInstance, category, lastpage) {
	for (var page = 1; page <= lastpage; page++) {
		var gsecMsgList = await gsecInstance.fetchMessagesList(category, page);
		if (category == 0) {
			whom = 1;
		} else {
			whom = 0;
		}
		renderMessages(gsecMsgList, whom, 1);
	}
}

async function renderMessages(gsecMsgList, whom, order = 1) { // order: 1=newest>olest 0=oldest>newest 2=autodetect (todo-not implemented)
	for (const message of gsecMsgList) { // whom: 0=me 1=you
		if (message.subject.startsWith("ba-ctlmsg-chat-")) {
			addMessage(whom, message.subject.substring(20), 2, message.date.getTime);
		}
	}
}
