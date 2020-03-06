const API_ENDPOINT = "https://gimb.tk/test.php";
const DIRECTORY_URL = "/directory.json";
// "Global" object for name directory
var directory = null;

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
    if(window.location.hash.length > 1) {
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

// Function, responsible for fetching and displaying data
async function loadMessages(force_refresh = true, katera = 0) {
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

        if (messages === null || force_refresh) {
            $.ajax({
                url: API_ENDPOINT,
                crossDomain: true,
                data: {
                    "u": username,
                    "p": password,
                    "m": "fetchsporocilaseznam",
                    "a": katera // Message type, see API doc for details
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
                        localforage.setItem("messages", data).then((value) => {
                            messages = value;
                            displayData();
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
            displayData();
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
                "a": id
            },
            dataType: "json",
            cache: false,
            type: "GET",
            success: (data) => {
                // If data is null, the request failed
                if (data === null) {
										UIAlert( D("unableToReceiveTheMessage") + " " + D("requestFailed") );
                    setLoading(false);
                } else {
                    displayMessage(id, data);
                    setLoading(false);
                }
            },

            error: () => {
								UIAlert( D("unableToReceiveTheMessage") + " " + D("noInternetConnection") );
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
                "a": id
            },
            dataType: "json",
            cache: false,
            type: "GET",
            success: (data) => {
                // If data is null, the request failed
                if (data === null) {
										UIAlert( D("unableToDeleteTheMessage") + " " + D("requestFailed") );
                    setLoading(false);
                } else {
                    document.getElementById("msg_box-" + id).remove();
                    setLoading(false);
                }
            },

            error: () => {
								UIAlert( D("unableToDeleteTheMessage") + " " + D("noInternetConnection") );
                setLoading(false);
            }

        })
    });
}

function displayMessage(id, data) {
    if(data["telo"].substring(0, 21) == "<!-- beziapp-e2eemsg-") {
	    	var datatodecrypt = data["telo"].substring(29+Number(data["telo"].substring(21, 25)), data["telo"].length-6) // length-6 da zbrišemo zadnji </div>
		var randomencdivid = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
		var msgcontent = "<div id='beziapp-msg-e2ee-form-"+randomencdivid+"'>"+D("thisMessageWasEncrypted")
			+"<input type=password autocomplete=new-password id=beziapp-msg-e2ee-password-"+randomencdivid+" placeholder='"+S("password")+" ...'><button type=button"
			+"value=Decrypt! class='btn waves-effect waves-light' onclick=document.getElementById('beziapp-msg-e2ee-content-"+randomencdivid+"').innerHTML="
			+"filterXSS(sjcl.decrypt(document.getElementById('beziapp-msg-e2ee-password-"+randomencdivid+"').value,document.getElementById('beziapp-msg-e2ee-content-"
			+randomencdivid+"').innerHTML));document.getElementById('beziapp-msg-e2ee-content-"+randomencdivid+"').hidden=false;document."
			+"getElementById('beziapp-msg-e2ee-form-"+randomencdivid+"').hidden=true >"+S("decrypt")+"!</button></div><div id='beziapp-msg-e2ee-content-"+randomencdivid+"' hidden='hidden'>"
			+datatodecrypt+"</div>";
	    document.getElementById("msg_body-" + id).innerHTML = msgcontent;
    } else {
    	document.getElementById("msg_body-" + id).innerHTML = filterXSS(data["telo"]);
    }
}

// Function for displaying data
function displayData() {
    let msg_list = document.getElementById("msg-list");
    msg_list.innerHTML = "";
    messages.forEach(element => {
        if (element["zadeva"].substr(0, 14) != "beziapp-ctlmsg") {
            msg_list.innerHTML += '<div class="col s12 m6" id="msg_box-' +
                filterXSS(element["id"]) +
                '"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">' +
		filterXSS(element["zadeva"]) +
                '</span><p id="msg_body-' +
                filterXSS(element["id"]) +
                '"><button class="btn waves-effect waves-light" onclick=loadMsg("' +
                filterXSS(element["id"]) +
                '"); type="submit">Load message body<i class="material-icons right">system_update</i></button></p></div><div class="card-action"><a href=javascript:deleteMsg("' +
                filterXSS(element["id"]) +
                '");><i class="material-icons">delete</i></a><a href=\'javascript:document.getElementById("full_name").value="' +
                filterXSS(element["posiljatelj"]) +
                '";document.getElementById("msg_subject").value="Re: ' +
                filterXSS(element["zadeva"]) +
                '";M.updateTextFields();document.getElementById("navigation-main").scrollIntoView();\'><i class="material-icons">reply</i></a>' +
                filterXSS(element["posiljatelj"]) + " &raquo; " + filterXSS(element["datum"]["dan"]) + ". " + filterXSS(element["datum"]["mesec"]) + ". " + filterXSS(element["datum"]["leto"]) + " at " +
                filterXSS(element["cas"]["ura"]) + ":" + filterXSS(element["cas"]["minuta"]) +
                '</div></div></div>';
	}
    });
    document.getElementById("storage-bar").hidden = false;
    document.getElementById("storage-progressbar").style.width = Number(Number(messages.length/120)*100).toFixed(2)+"%";
    document.getElementById("storage-desc").innerHTML = messages.length+"/120 "+s("messages")+" "+document.getElementById("storage-progressbar").style.width;
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
                // we CAN'T know wether the mesgg was delievered
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
            document.getElementById("msg-send").disabled = false;
        } else {
            $("#full-name").addClass("invalid");
            $("#full-name").removeClass("valid");
            document.getElementById("msg-send").disabled = true;
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
                additionalstufftoaddtomessage += '<br><img src="' + readerEvent.target.result + '" />'; // this is the content!
                if(document.getElementById("msg-added-image").innerHTML.length > 1) {
			document.getElementById("msg-added-image").innerHTML += '<img style=width:20mm src="' + readerEvent.target.result + '" />'; // this is the content!
		} else {
			document.getElementById("msg-added-image").innerHTML = "<input type=button value='"+S("removeImages")+"' class='btn waves-effect waves-light' "
			+"onclick=additionalstufftoaddtomessage='';document.getElementById('msg-added-image').innerHTML='' /><br>"+D("largeImagesNote")+"<br>"+S("attachedImages")+":<br><img style=width:20mm "
			+"src='"+readerEvent.target.result+"' />"; // ravno obratni narekovaji
		}
		UIAlert(D("imageAddedAsAnAttachment"));
            }
        }
        input.click();
    });

    // Verify recipient when input loses focus
    $("#full-name").on("blur", validateName);

    // Button to send message
    $("#msg-send").click(() => {
        localforage.getItem("directory").then(function (value) {
            var msgcontent = document.getElementById("msg-body").value + additionalstufftoaddtomessage;
            var msgsubject = document.getElementById("msg-subject").value;
	    if(document.getElementById("msg-e2ee-pass").hidden == false) {
		var randomencdivid = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
		var addrparts = window.location.href.split("/"); // engleski
		msgcontent = "<script src='"+addrparts[0]+"//"+addrparts[2]+"/js/lib/sjcl.js'></script><div id='beziapp-msg-e2ee-form-"+randomencdivid+"'>This message was encrypted by BežiApp."
			+"<input type=password autocomplete=new-password id=beziapp-msg-e2ee-password-"+randomencdivid+" placeholder='Enter password ...'><input type=button value=Decrypt! onclick="
			+"document.getElementById('beziapp-msg-e2ee-content-"+randomencdivid+"').innerHTML=sjcl.decrypt(document.getElementById('beziapp-msg-e2ee-password-"
			+randomencdivid+"').value,document.getElementById('beziapp-msg-e2ee-content-"+randomencdivid+"').innerText);document.getElementById('beziapp-msg-e2ee-content-"+randomencdivid
			+"').hidden=false;document.getElementById('beziapp-msg-e2ee-form-"+randomencdivid+"').hidden=true ></div><div id='beziapp-msg-e2ee-content-"+randomencdivid+"' hidden='hidden'>";
		msgcontent = "<!-- beziapp-e2eemsg-"+msgcontent.length.toString().padStart(4, '0')+" -->"+msgcontent
			+sjcl.encrypt(document.getElementById("msg-e2ee-pass-input").value, document.getElementById("msg-body").value)+"</div>";
	    }
            sendMessage(value[document.getElementById("full-name").value], msgsubject,
                htmlEncode(msgcontent));
            document.getElementById("msg-body").value = "";
            document.getElementById("full-name").value = "";
            document.getElementById("msg-subject").value = "";
            document.getElementById("msg-send").disabled = true;
            additionalstufftoaddtomessage = "";
	    document.getElementById("msg-added-image").innerHTML = "";
	    document.getElementById("msg-e2ee-pass").hidden = true;
        }).catch(function (err) {
						UIAlert( D("unableToReadDirectory") + " " + D("messageCouldNotBeSend"), "45245" );
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

    var receivedmessages = null;
    loadMessages(true, 0);
    M.updateTextFields();

    // Setup side menu
    const menus = document.querySelectorAll(".side-menu");
    M.Sidenav.init(menus, { edge: "right", draggable: true });

});
