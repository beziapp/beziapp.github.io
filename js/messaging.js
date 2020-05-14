const API_ENDPOINT = "https://gimb.tk/test.php";
const DIRECTORY_URL = "/directory.json";

const ENCRYPTED_MESSAGE_REGEX = /<!-- beziapp-e2eemsg-(\d{4}) -->(\S+?)<!-- end-msg -->/g;

// "Global" object for name directory and messages
var directory = null;
var messages = {
    "0": [],
    "1": [],
    "2": []
}
var current_tab = 0;

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
                    document.getElementById("msg-send").disabled = true;
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
    let elems = document.querySelectorAll(".autocomplete-fullname");
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

    if (window.location.hash.length > 1 && !window.location.hash.substring(1).startsWith("beziapp")) {
    	$("#full-name").val(decodeURIComponent(window.location.hash.substring(1)));
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

// Function, responsible for fetching and displaying data
async function loadMessages(force_refresh = true, messageType = 0) {
    setLoading(true);
    // Load required data
    let promises_to_run = [
        localforage.getItem("username").then((value) => {
            username = value;
        }),
        localforage.getItem("password").then((value) => {
            password = value;
        }),
        localforage.getItem("messages").then((value) => {
            messages = value;
        })
    ];

    Promise.all(promises_to_run).then(() => {

        if (messages[messageType] == null || messages[messageType].length === 0 || force_refresh) {
            $.ajax({
                url: API_ENDPOINT,
                crossDomain: true,
                data: {
                    "u": username,
                    "p": password,
                    "m": "fetchsporocilaseznam",
                    "a": messageType // Message type, see API doc for details
                },
                dataType: "json",
                cache: false,
                type: "GET",

                success: (data) => {
                    // If data is null, the request failed
                    if (data === null) {
						UIAlert( D("requestFailed") );
                        setLoading(false);
                    } else {
                        // Save messages & populate view
                        // console.log(data); // debug
                        messages[messageType.toString()] = data;
                        localforage.setItem("messages", messages).then((value) => {
                            displayData(messageType);
                            setLoading(false);
                        });
                    }
                },

                error: () => {
					UIAlert( D("errorFetchingMessages") );
                    setLoading(false);
                }
            })
        } else {
            displayData(messageType);
            setLoading(false);
        }
    });
}

async function loadMsg(id) {

    setLoading(true);
    // Load required data
    let promises_to_run = [
        localforage.getItem("username").then((value) => {
            username = value;
        }),
        localforage.getItem("password").then((value) => {
            password = value;
        }),
    ];

    Promise.all(promises_to_run).then(() => {
        $.ajax({
            url: API_ENDPOINT,
            crossDomain: true,
            data: {
                "u": username,
                "p": password,
                "m": "fetchsporocilo",
                "a": id.replace(/_/g, "|")
            },
            dataType: "json",
            cache: false,
            type: "GET",
            success: (data) => {
                // If data is null, the request failed
                if (data === null) {
					UIAlert( `${D("unableToReceiveTheMessage")} ${D("requestFailed")}` );
                } else {
                    displayMessage(id, data);
                }
                setLoading(false);
            },

            error: () => {
				UIAlert( `${D("unableToReceiveTheMessage")} ${D("noInternetConnection")}` );
                setLoading(false);
            }

        })
    });
}


async function deleteMsg(id) {
    setLoading(true);
    // Load required data
    let promises_to_run = [
        localforage.getItem("username").then((value) => {
            username = value;
        }), localforage.getItem("password").then((value) => {
            password = value;
        }),
    ];
    Promise.all(promises_to_run).then(() => {
        $.ajax({
            url: API_ENDPOINT,
            crossDomain: true,
            data: {
                "u": username,
                "p": password,
                "m": "izbrisisporocilo",
                "a": id.replace(/_/g, "|")
            },
            dataType: "json",
            cache: false,
            type: "GET",
            success: (data) => {
                // If data is null, the request failed
                if (data === null) {
					UIAlert( `${D("unableToDeleteTheMessage")} ${D("requestFailed")}` );
                } else {
                    document.getElementById("msg_box-" + id).remove();
                }
                setLoading(false);
            },

            error: () => {
				UIAlert( `${D("unableToDeleteTheMessage")} ${D("noInternetConnection")}` );
                setLoading(false);
            }

        })
    });
}

function displayMessage(id, data) {
    let regex_results = ENCRYPTED_MESSAGE_REGEX.exec(data["telo"]);
    if (regex_results != null) {
	    var datatodecrypt = regex_results[2];
        var randomencdivid = Math.floor(Math.random() * 9999).toString().padStart(4, "0");

        var msgcontent = `
        <div id='beziapp-msg-e2ee-form-${randomencdivid}'>
            ${D("thisMessageWasEncrypted")}
            <input type="password" autocomplete="new-password" id="beziapp-msg-e2ee-password-${randomencdivid}" placeholder="${S("password")} ...">
            <button
                type="button"
                value="Decrypt"
                class="btn waves-effect waves-light"
                onclick="
                    $('#beziapp-msg-e2ee-content-${randomencdivid}').html(
                        filterXSS(
                            sjcl.decrypt(
                                $('#beziapp-msg-e2ee-password-${randomencdivid}').val(),
                                $('#beziapp-msg-e2ee-content-${randomencdivid}').html()
                            )
                        )
                    );
                    $('#beziapp-msg-e2ee-content-${randomencdivid}').show();
                    $('#beziapp-msg-e2ee-form-${randomencdivid}').hide();
                "
            >
                ${S("decrypt")}
            </button>
        </div>
        <div id="beziapp-msg-e2ee-content-${randomencdivid}" hidden>
            ${datatodecrypt}
        </div>
        `
	    $(`#msg_body-${id.replace(/\|/g, "_")}`).html(msgcontent);
    } else {
        $(`#msg_body-${id.replace(/\|/g, "_")}`).html(filterXSS(data["telo"]));
    }
}

// Function for displaying data
function displayData(messageType) {
    let div_selector = "";
    switch (messageType) {
        case 0:
            div_selector = "#beziapp-received";
            break;
        case 1:
            div_selector = "#beziapp-sent";
            break;
        case 2:
            div_selector = "#beziapp-deleted";
            break;
    }

    // $("#storage-bar").show();
    $("#storage-progressbar").width(Number(Number(getNumMessages(messageType) / 120) * 100).toFixed(2) + "%");
    $("#storage-stats").text(`${getNumMessages(messageType)}/120`);

    let msg_list = $(div_selector);
    msg_list.html("");
    messages[messageType].forEach(element => {
        if (!element["zadeva"].startsWith("beziapp-ctlmsg")) {

            msg_list.append(`
                <div class="col s12 m12" id="msg_box-${filterXSS(element["id"])}">
                    <div class="card blue-grey darken-1">
                        <div class="card-content white-text">
                            <span class="card-title">
                                ${filterXSS(element["zadeva"])}
                            </span>
                            <p id="msg_body-${filterXSS(element["id"]).replace(/\|/g, "_")}">
                                <button
                                    class="btn waves-effect waves-light"
                                    onclick="loadMsg('${filterXSS(element["id"])}')"
                                    type="submit"
                                >
                                    Load message
                                    <i class="material-icons right">move_to_inbox</i>
                                </button>
                            <p>
                        </div>
                        <div class="card-action">
                            <a onclick="deleteMsg('${filterXSS(element["id"])}')">
                                <i class="material-icons">delete</i>
                            </a>
                            <a onclick="
                                $('#full_name').val('${filterXSS(element["posiljatelj"])}');
                                $('#msg_subject').val('Re: ${filterXSS(element["zadeva"])}');
                                M.updateTextFields();
                                $('#navigation-main').scrollIntoView();
                                "
                            >
                                <i class="material-icons">reply</i>
                            </a>
                            ${filterXSS(element["posiljatelj"])} &raquo; ${filterXSS(element["datum"]["dan"])}. ${filterXSS(element["datum"]["mesec"])}. ${filterXSS(element["datum"]["leto"])} at ${filterXSS(element["cas"]["ura"]).padStart(2, "0")}:${filterXSS(element["cas"]["minuta"]).padStart(2, "0")}
                        </div>
                    </div>
                </div>
            `);
	    }
    });
}

// -1 = cumulative
function getNumMessages(messageType = -1) {
    if (messageType === -1) {
        let sum = 0;
        for (const [messageType, messageList] of Object.entries(messages)) {
            sum += messageList.length;
        }
        return sum;
    } else {
        return (messages[messageType].length ?? 0);
    }
}

async function sendMessage(recipient_number, subject, body) {
    setLoading(true);
    let promises_to_run = [
        localforage.getItem("username").then((value) => {
            username = value;
        }),
        localforage.getItem("password").then((value) => {
            password = value;
        }),
    ];
    Promise.all(promises_to_run).then(() => {
        $.ajax({
            url: API_ENDPOINT,
            crossDomain: true,
            data: {
                "u": username,
                "p": password,
                "m": "posljisporocilo",
                "a": recipient_number,
                "b": subject,
                "c": body
            },

            dataType: "json",
            cache: false,

            type: "POST",
            success: () => {
                // we CAN'T know wether the message was delievered
				UIAlert(D("messageWasProbablySent"));
                setLoading(false);
            },
            error: () => {
				UIAlert(D("errorSendingMessage"), D("noInternetConnection"));
                setLoading(false);
            }
        })
    });
}

async function validateName() {
    if (directory !== null) {
        if ($("#full-name").val() in directory) {
            $("#full-name").addClass("valid");
            $("#full-name").removeClass("invalid");
            $("#msg-send").prop("disabled", false);
        } else {
            $("#full-name").addClass("invalid");
            $("#full-name").removeClass("valid");
            $("#msg-send").prop("disabled", true);
        }
    }
}

// Setup event listeners for buttons
function setupEventListeners() {
    // Button to add a photo
    $("#msg-add-photo").click(() => {
        let input = document.createElement("input");
        input.type = "file";
        input.onchange = (e) => {
            // getting a hold of the file reference
            let file = e.target.files[0];
            // setting up the reader
            let reader = new FileReader();
            reader.readAsDataURL(file); // this is reading as data url

            // here we tell the reader what to do when it's done reading...
            reader.onload = readerEvent => {
                additionalstufftoaddtomessage += `<br><img src="${readerEvent.target.result}" />`; // this is the content!
                if ($("#msg-added-image").html().length > 1) {
                    $("#msg-added-image").append(`<img style="width: 20mm" src="${readerEvent.target.result}" />`);
		        } else {
                    $("#msg-added-image").html(`
                        <input
                            type="button"
                            value="${S("removeImages")}"
                            class="btn waves-effect waves-light"
                            onclick="
                                additionalstufftoaddtomessage = '';
                                $('#msg-added-image').html('');
                            "
                        />
                        <br>
                        ${D("largeImagesNote")}
                        <br>
                        ${S("attachedImages")}:
                        <br>
                        <img style="width:20mm" src="${readerEvent.target.result}" />
                    `);
                    // ravno obratni narekovaji
		        }
		        UIAlert(D("imageAddedAsAnAttachment"));
            }
        }
        input.click();
    });

    // Verify recipient when input loses focus
    $("#full-name").on("blur", validateName);

    // Setup refresh icon
    $("#refresh-icon").click(() => {
		loadMessages(true, current_tab);
    });

    // Setup checkbox handler
	$("#encrypt-checkbox").change(function() {
		if (this.checked) {
            $("#encryption-key-input").prop("hidden", false);
        } else {
            $("#encryption-key-input").prop("hidden", true);
        }
	});

    // Button to send message
    $("#msg-send").click(() => {
        localforage.getItem("directory").then(function (value) {
            var msgcontent = $("#msg-body").val() + additionalstufftoaddtomessage;
            var msgsubject = $("#msg-subject").val();
	        if ($("#msg-e2ee-pass").prop("hidden") !== true) {
		        var randomencdivid = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
                var addrparts = window.location.href.split("/"); // engleski
                
                var encrypted_message = sjcl.encrypt($("#msg-e2ee-pass-input").val(), msgcontent);

                msgcontent = `
                    <script src="${addrparts[0]}//${addrparts[2]}/js/lib/sjcl.js"></script>
                    <div id="beziapp-msg-e2ee-form-${randomencdivid}">
                        This message was encrypted by BežiApp.
                        <input type="password" autocomplete="new-password" id="beziapp-msg-e2ee-password-${randomencdivid}" placeholder="Enter password ...">
                        <input type="button" value="Decrypt" onclick="
                            console.log($('beziapp-msg-e2ee-content-${randomencdivid}').text());
                            $('#beziapp-msg-e2ee-content-${randomencdivid}').html(
                                sjcl.decrypt(
                                    $('#beziapp-msg-e2ee-password-${randomencdivid}').val(),
                                    $('beziapp-msg-e2ee-content-${randomencdivid}').text()
                                )
                            );
                            $('#beziapp-msg-e2ee-content-${randomencdivid}').show();
                            $('#beziapp-msg-e2ee-form-${randomencdivid}').hide();
                            "
                        >
                    </div>
                    <div id="beziapp-msg-e2ee-content-${randomencdivid}" hidden>
                        <!-- beziapp-e2eemsg-${msgcontent.length.toString().padStart(4, "0")} -->${encrypted_message}<!-- end-msg -->
                    </div>
                `
            }
            
            console.log(msgcontent);
            console.log(encrypted_message);

            sendMessage(value[$("#full-name").val()], msgsubject, htmlEncode(msgcontent));
            $("#msg-body").val("");
            $("#full-name").val("");
            $("#msg-subject").val("");
            $("#msg-send").prop("disabled", true);
            additionalstufftoaddtomessage = "";

	        $("#msg-added-image").html("");
            $("#msg-e2ee-pass").hide();
            
        }).catch(function (err) {
			UIAlert( `${D("unableToReadDirectory")} ${D("messageCouldNotBeSend")}`, "45245" );
            console.log(err);
        });
    });
}

function getUrlParameter(sParam) {
    const url_params = new URLSearchParams(window.location.search);
    const found_param = url_params.get(sParam);
    return found_param
}

var additionalstufftoaddtomessage = "";
document.addEventListener("DOMContentLoaded", () => {

    checkLogin();
    loadDirectory();
    setupEventListeners();

    // Setup tabs
    const tabs = document.querySelectorAll(".tabs");
    const tab_options = {
        // swipeable: true, // TODO: figure out how to fix height when it's enabled (it's good for UX to have it enabled)
        onShow: (tab) => {
            if ($(tab).hasClass("active")) {
                switch (tab.id) {
                    case "beziapp-received":
                        current_tab = 0;
                        loadMessages(false, 0);
                        break;
                    case "beziapp-sent":
                        current_tab = 1;
                        loadMessages(false, 1);
                        break;
                    case "beziapp-deleted":
                        current_tab = 2;
                        loadMessages(false, 2);
                        break;
                }
            }
        }
    };
    var instance = M.Tabs.init(tabs, tab_options);

    // Setup floating action button
    const fab_options = {
        hoverEnabled: false,
        toolbarEnabled: false
    }
    const fab_elem = document.querySelectorAll(".fixed-action-btn");
    var instances = M.FloatingActionButton.init(fab_elem, fab_options);

    // Setup modals
    const modal_elems = document.querySelectorAll('.modal');
    const modal_options = {
        onOpenStart: () => { $("#fab-new").hide() },
        onCloseEnd: () => { $("#fab-new").show() },
        dismissible: false
    };
    var instances = M.Modal.init(modal_elems, modal_options);

    var receivedmessages = null;
    loadMessages(true, 0);
    M.updateTextFields();

    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });
});