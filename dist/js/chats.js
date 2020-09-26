// const API_ENDPOINT = "https://gimb.tk/test.php";
const DIRECTORY_URL = "/directory.json";
const CHATS_BEGIN_TAG = "<!-- ba-ctlmsg-chat-begin -->";
const CHATS_END_TAG = "<!-- ba-ctlmsg-chat-end -->";
const CHAT_REGEX = /<!-- ba-ctlmsg-chat-begin -->([\S\s]+)<!-- ba-ctlmsg-chat-end -->/g;
const CHATS_SUBJECT_PREFIX = "ba-ctlmsg-chat-";

// "Global" object for name directory
let directory = null;
let currentlyChattingWith = null; // msgid
let sogovornik = null; // name
let firstPageOfMessages = null; // so we can test if new messages ever arrive

/**
 * Redirects user to login page if it's not logged int
 */
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

/**
 * Find the matching key for a provided value in an object
 * @param {object} object Object to search
 * @param {object} value  Value to find the matching key for
 * @returns {object} Key
 */
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

// -----------HTML HELPERS-----------
/**
 * Encode HTML entities
 * @param {string} value Value to encode
 * @returns {string} Encoded value
 */
function htmlEncode(value) {
    /**
        Create a in-memory element, set its inner text
        (which is automatically encoded)
        Then grab the encoded contents back out.
        The element never exists on the DOM.
    **/
    return $("<textarea/>").text(value).html();
}

/**
 * Decode HTML entities
 * @param {string} value Value to decode
 * @returns {string} Decoded value
 */
function htmlDecode(value) {
    return $("<textarea/>").html(value).text();
}
// ---------------------------------

// Try to fetch name:id directory
/**
 * Fetch name:id directory and populate it in the app
 */
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
            localforage.getItem("directory").then((storedDirectory) => {
                if (storedDirectory === null) {
                    // If unable, set directory to null
                    // (so other functions know that we don't have it)
                    UIAlert(
                        D("nameDirectoryNotSet"),
                        "loadDirectory(): stored_directory === null"
                        );
                    directory = null;
                    // Disable send button
                    $("#msg-send").prop("disabled", true);
                } else {
                    directory = storedDirectory;
                    // Populate autocomplete
                    populateAutocomplete();
                }
            });
        }
    });
}

/**
 * Populate autocomplete DOM object with the values
 * fetched from the server
 */
function populateAutocomplete() {
    let elems = document.querySelectorAll('.autocomplete-fullname');
    /**
        če se uporablja globalna var directory, ki je shranjena
        kot objekt (vedno shranjen kot reference), bo pri let x=y
        x le pointer na object y in se bo spremenil z spremembo
        "originala". spodnja stvar itak ni preveč efficent, loop čez
        vseh 7000 ljudi bi lahko delal težave...
        kakšen Object.keys bi bila boljša varianta ampak raje napišem
        tale komentar... idk, to se mi je zdelo uporabno ampak sedaj obžalujem
        samo guglal sem "copying an object js"
    **/

    let autocompleteEntries = Object.assign({}, directory);
    for (const [key] of Object.entries(autocompleteEntries)) {
        autocompleteEntries[key] = null;
    }

    M.Autocomplete.init(elems, {
        data: autocompleteEntries,
        onAutocomplete: validateName,
        minLength: 0
    });

    if (window.location.hash.length > 1) {
        $("#full-name").val(decodeURIComponent(window.location.hash.substring(1)));
    } else {
        $("#full-name").val(getUrlParameter("m"));
    }

    M.updateTextFields();
    validateName();
}

/**
 * Toggle loading bar state
 * @param {boolean} state Desired state
 */
function setLoading(state) {
    if (state) {
        $("#loading-bar").removeClass("hidden");
    } else {
        $("#loading-bar").addClass("hidden");
    }
}

/**
 * Send a message to the recipient
 * @param {number} recipientNumber Recipient's id
 * @param {string} body Message body
 */
async function sendMessage(recipientNumber = null, body = null) {
    // == catches null & undefined
    if (recipientNumber == null) {
        recipientNumber = directory[sogovornik];
    }

    if (body == null) {
        body = $("#msg-body").val();
    }

    if (body.length > 180) {
        throw new RangeError(
            "sendMessage(): message is longer than 180 characters."
        );
    }

    let promisesToRun = [
        localforage.getItem("username").then((value) => {
            username = value;
        }),
        localforage.getItem("password").then((value) => {
            password = value;
        }),
    ];
    setLoading(true);
    Promise.all(promisesToRun).then(() => {
        try {
            let gsecInstance = new gsec();
            gsecInstance.login(username, password).then( () => {
                gsecInstance.sendMessage(
                    recipientNumber,
                    CHATS_SUBJECT_PREFIX + body,
                    S("chatExternalInfo") + CHATS_BEGIN_TAG + body + CHATS_END_TAG
                ).then(() => {

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

// datePlacement:
/**
 * Add message to the UI
 * @param {boolean} isSender Indicates if current user is sender of the message
 * @param {string} body Message body
 * @param {number} [datePlacement=0] 0=append bubble to end, 1=append bubble to start.
 * @param {Date} [messageDate=null] Timestamp of the message
 */
function addMessage(isSender, body, datePlacement=0, messageDate=null) {
    var whos = isSender == 0 ? "mine": "yours";

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

    var istaOseba;
    var messagesnest;
    if (chatarea.childElementCount == 0) {
        bubblenode.className = "message last";
        messagesnest = document.createElement("div");
        istaOseba = false;
    } else {

        if (datePlacement == 0 || timestamp > Number(alreadyMessages[alreadyMessages.length - 1].getAttribute("data-date"))) {

            datePlacement = 0;
            console.log(alreadyMessages[0].getAttribute("data-date"));
            bubblenode.className = "message last";
            if (chatarea.children.item(chatarea.children.length - 1).classList.contains(whos)) { // ista oseba
                istaOseba = true;
                messagesnest = chatarea.children.item(chatarea.children.length - 1);
                messagesnest.children.item(messagesnest.children.length - 1).classList.remove("last");
            } else {
                istaOseba = false;
                messagesnest = document.createElement("div");
            }

        } else if (datePlacement == 1 || timestamp < Number(alreadyMessages[0].getAttribute("data-date"))) {

            datePlacement = 1;
            console.log(alreadyMessages[0].getAttribute("data-date"));
            if(chatarea.children.item(0).classList.contains(whos)) { // ista oseba
                bubblenode.className = "message";
                istaOseba = true;
                messagesnest = chatarea.children.item(0);
            } else {
                bubblenode.className = "message last";
                istaOseba = false;
                messagesnest = document.createElement("div");
            }

        } else { // auto place (slower, so 0 or 1 are options

            console.log("if3");
            for (var iter = 0; iter < alreadyMessages.length - 2; iter++) { // (-2 zato, ker potem iter+1 ne obstaja pri zadnjem elementu)
                if (Number(alreadyMessages[iter].getAttribute("data-date")) < timestamp
                    && Number(alreadyMessages[iter+1].getAttribute("data-date")) > timestamp) {

                    var zgornjiIsti = alreadyMessages[iter].parentElement.classList.contains(whos);
                    var spodnjiIsti = alreadyMessages[iter+1].parentElement.classList.contains(whos);
                    console.log([zgornjiIsti, spodnjiIsti]);

                    if (zgornjiIsti && spodnjiIsti) {
                        messagesnest = alreadyMessages[iter].parentElement;
                        bubblenode.className = "message";
                        messagesnest.insertBefore(bubblenode, alreadyMessages[iter+1]);
                        return;
                    }

                    if (zgornjiIsti && !spodnjiIsti) {
                        messagesnest = alreadyMessages[iter].parentElement;
                        bubblenode.className = "message last";
                        messagesnest.children.item(messagesnest.childElementCount - 1).classList.remove("last");
                        messagesnest.appendChild(bubblenode);
                        return;
                    }

                    if (!zgornjiIsti && spodnjiIsti) {
                        messagesnest = alreadyMessages[iter+1].parentElement;
                        bubblenode.className = "message";
                        messagesnest.insertBefore(bubblenode, alreadyMessages[iter+1]);
                        return;
                    }

                    throw new RangeError("This should not happen!");
                }
            }
            throw new RangeError("This should not happen!");

        }
    }

    // autodetect date is not present here anymore
    messagesnest.className = whos + " messages";
    if (datePlacement == 0) {
        messagesnest.appendChild(bubblenode);
    } else {
        messagesnest.prepend(bubblenode);
    }

    if (!istaOseba) {
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

    if (!Object.keys(directory).includes(name)) {
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
        if (message.subject.startsWith(CHATS_SUBJECT_PREFIX)) {
            console.log(message);
            addMessage(whom, message.subject.substring(CHATS_SUBJECT_PREFIX.length), 2, message.date.getTime);
        }
    }
}

function setupEventListeners() {
    $("#chat-recipient-select-btn").click(() => {
        setRecipient();
    });

    $("#msg-send").click(() => {
        sendMessage();
    });

    $("#full-name").on("input", () => {
        validateName();
    });

    $("#msg-body").on("input", () => {
        updateSendButton();
    });
}

document.addEventListener("DOMContentLoaded", () => {

    checkLogin();
    loadDirectory();

    setupEventListeners();

    updateSendButton();

    // var receivedmessages = null;

    M.updateTextFields();

    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });
    let elems = document.querySelectorAll(".modal");
    M.Modal.init(elems, {});

    // Setup side modal
    const modals = document.querySelectorAll(".side-modal");
    M.Sidenav.init(modals, { edge: "left", draggable: false });
    prepareAndStartFetchingMessages(); // just opens modal, as there is no recipient selected
});