function htmlEncode(value){
  // Create a in-memory element, set its inner text (which is automatically encoded)
  // Then grab the encoded contents back out. The element never exists on the DOM.
  return $('<textarea/>').text(value).html();
}

function htmlDecode(value){
  return $('<textarea/>').html(value).text();
}

const API_ENDPOINT = "https://gimb.tk/test.php";
// const API_ENDPOINT = "http://localhost:5000/test.php";

var receivedmessages = null;
if(window.location.search.substring(1)) {
	document.getElementById("full_name").value = window.location.search.substring(1);
	validateName();
}
loadMessages(true, 0);

localforage.setItem('directory', {
"Anton Luka Šijanec": 6326,
"Rok Štular": 5313
}).then(function (value) {
    // Do other things once the value has been saved.
    console.log("fake directory set");
}).catch(function(err) {
    // This code runs if there were any errors
    M.toast({ html: "Unable to set fake directory."});
    console.log(err);
});
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
        // If we don't have a list of teachers, query it
        if (messages === null || force_refresh) {
            $.ajax({
                url: API_ENDPOINT,
                crossDomain: true,
                data: {
                    "u": username,
                    "p": password,
                    "m": "fetchsporocilaseznam",
		    "a": katera // prejeta
                },
                dataType: "json",
                cache: false,
                type: "GET",
                success: (data) => {
                    // If data is null, the request failed
                    if (data === null) {
                        M.toast({ html: "Request failed!" });
                        setLoading(false);
                    } else {
                        // Save teachers & populate table
                        localforage.setItem("messages", data).then((value) => {
                            messages = value;
                            displayData();
                            setLoading(false);
                        });
                    }
                },

                error: () => {
                    M.toast({ html: "Error fetching messages!" });
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
                        M.toast({ html: "Unable to receive the message, Request failed!" });
                        setLoading(false);
                    } else {
                        displayMessage(id, data);
                        setLoading(false);
                    }
                },

                error: () => {
                    M.toast({ html: "Error fetching message, No Internet connnection?" });
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
                    "m": "izbrisisporocilo",
		    "a": id
                },
                dataType: "json",
                cache: false,
                type: "GET",
                success: (data) => {
                    // If data is null, the request failed
                    if (data === null) {
                        M.toast({ html: "Unable to delete the message, Request failed!" });
                        setLoading(false);
                    } else {
			document.getElementById("msg_box-"+id).remove();
                        setLoading(false);
                    }
                },

                error: () => {
                    M.toast({ html: "Unable to delete the message, No Internet connnection?" });
                    setLoading(false);
                }

            })
    });
}
function displayMessage(id, data) {
	document.getElementById("msg_body-"+id).innerHTML = filterXSS(data["telo"]);
}
// Function for displaying data
function displayData() {
	var msg_list = document.getElementById("msg_list");
	msg_list.innerHTML = "";
    messages.forEach(element => {
	msg_list.innerHTML += '<div class="col s12 m6" id="msg_box-'+
filterXSS(element["id"])+
'"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">'+
filterXSS(element["zadeva"])+
'</span><p id="msg_body-'+
filterXSS(element["id"])+
'"><button class="btn waves-effect waves-light" onclick=loadMsg("'+
filterXSS(element["id"])+
'"); type="submit">Load message body<i class="material-icons right">system_update</i></button></p></div><div class="card-action"><a href=javascript:deleteMsg("'+
filterXSS(element["id"])+
'");><i class="material-icons">delete</i></a><a href=\'javascript:document.getElementById("full_name").value="'+
filterXSS(element["posiljatelj"])+
'";document.getElementById("msg_subject").value="Re: '+
filterXSS(element["zadeva"])+
'";M.updateTextFields();document.getElementById("navigation-main").scrollIntoView();\'><i class="material-icons">reply</i></a>'+
filterXSS(element["posiljatelj"])+" &raquo; "+filterXSS(element["datum"]["dan"])+". "+filterXSS(element["datum"]["mesec"])+". "+filterXSS(element["datum"]["leto"])+" at "+
filterXSS(element["cas"]["ura"])+":"+filterXSS(element["cas"]["minuta"])+
'</div></div></div>';
    });
}

async function sendMessage(number, subject, bofdy) {
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
		    "a": number,
		    "b": subject,
		    "c": bofdy
                },
                dataType: "json",
                cache: false,
                type: "POST", // big data not good, maybe u wanna many charzz
                success: (data) => {
			// we CAN't know wether the mesgg was delievered
                        M.toast({ html: "Message was probably sent, but check the Sent folder to be sure!" });
                        setLoading(false);
                },
                error: () => {
                    M.toast({ html: "Error sending message, No Internet connnection?" });
                    setLoading(false);
                }
            })
    });
}
function validateName() {
        localforage.getItem('directory').then(function(value) {
            if(value == null) {
                    M.toast({ html: "Unable to read directory of people. Name could not be verified. Directory is empty."});
            }
                var evals = value;
                for (var variableKey in evals){
                    if (evals.hasOwnProperty(variableKey)){
                        evals[variableKey] = null;
                    }
                }
                array =Object.getOwnPropertyNames(evals);
            if(array.includes(document.getElementById("full_name").value)) {
		document.getElementById("full_name").classList.add("valid");
		document.getElementById("msg_send").disabled = false;
            } else {
		document.getElementById("full_name").classList.add("invalid");
		document.getElementById("msg_send").disabled = true;
	    }
        }).catch(function(err) {
            M.toast({ html: "Unable to read directory of people. Name could not be verified."});
            console.log(err);
        });
}

  document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.autocomplete-fullname');
		localforage.getItem('directory').then(function(value) {
			// vse editam v nanotu
			var evals = value;
			for (var variableKey in evals){
			    if (evals.hasOwnProperty(variableKey)){
			        evals[variableKey] = null;
			    }
			}
		    var instances = M.Autocomplete.init(elems, {
			data: evals,
			onAutocomplete: validateName,
			minLength: 0
		    });
		}).catch(function(err) {
		    M.toast({ html: "Unable to read directory of people. Unable to autocomplete the name of the person."});
		    console.log(err);
		});

	document.getElementById("full_name").addEventListener("blur", validateName);
	document.getElementById("msg_send").addEventListener("click", function() {
		localforage.getItem('directory').then(function(value) {
		    sendMessage(value[document.getElementById("full_name").value], document.getElementById("msg_subject").value,
			htmlEncode(document.getElementById("msg_body").value));
		}).catch(function(err) {
		    M.toast({ html: "Unable to read directory of people. Message could not be sent."});
		    console.log(err);
		});
	});
	    // Setup side menu
	    const menus = document.querySelectorAll(".side-menu");
	    M.Sidenav.init(menus, { edge: "right", draggable: true });

  });
