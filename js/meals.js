const API_ENDPOINT = "https://lopolis-api.gimb.tk/";
var token, meals;
const jsDateDayString = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Freeday", "Day when you can finnaly rest", "Day when you get a girlfriend"];
const jsDateMonthString = ["January", "February", "March", "April", "May", "June", "July", "August", "October", "November", "December", "Elevener", "Zwölfer", "Teener", "14er"];
async function checkLogin() {
    localforage.getItem("logged_in_lopolis").then((value) => {
        if (value !== true) {
		document.getElementById("meals-container").hidden = true;
		document.getElementById("meals-login").hidden = false;
        } else {
		document.getElementById("meals-container").hidden = false;
		document.getElementById("meals-login").hidden = true;
	}
    }).catch((err) => {
        console.log(err);
    });
}
function setLoading(state) {
    if (state) {
        $("#loading-bar").removeClass("hidden");
    } else {
        $("#loading-bar").addClass("hidden");
    }
}
async function loadMeals(force_refresh = false) {
    setLoading(true);
    let promises_to_run = [
        localforage.getItem("lopolis_username").then((value) => {
            username = value;
        }),
        localforage.getItem("lopolis_password").then((value) => {
            password = value;
        }),
        localforage.getItem("meals").then((value) => {
            meals = value;
        })
    ];
    await Promise.all(promises_to_run);
    if (meals === null || meals === [] || force_refresh) {

        $.ajax({
            url: API_ENDPOINT+"gettoken",
            crossDomain: true,
	    contentType: "application/json",
	    data: JSON.stringify({ "username": username, "password": password         }),
            dataType: "json",
            cache: false,
            type: "POST",
            success: (dataauth) => {
                // If data is null, the request failed
                if (dataauth === null) {
                    M.toast({ html: "Authentication request failed!" });
                    setLoading(false);
                } else if(dataauth.error == true) {
                    M.toast({ html: "Authentication error!" });
                    setLoading(false);
		    localforage.setItem("logged_in_lopolis", false).then(()=>{checkLogin();});
		} else {
		    d = new Date();
		    $.ajax({
			url: API_ENDPOINT+"getmenus",
			crossDomain: true,
			contentType: "application/json",
			data: JSON.stringify({"month": d.getMonth()+1, "year": d.getFullYear()}),
			headers: {
				"Authorization": "Bearer "+dataauth.data
			},
			dataType: "json",
			cache: false,
			type: "POST",
			success: (data) => {
				if(data == null) {
                		    M.toast({ html: "Request to get menus failed!" });
		                    setLoading(false);
				} else if(data.error == true) {
				    M.toast({html:"Lopolis refused to serve menus"});
				    setLoading(false);
				} else {
       	        		    localforage.setItem("meals", data).then((value) => {
        	                	meals = value;
		                        displayMeals();
                		        setLoading(false);
		                    });
				}
			},
			error: () => {
				M.toast({html:"No internet connection or the server fucking crashed! )-:<"});
				setLoading(false);
			}
		    });
                }
            },

            error: () => {
                M.toast({ html: "No internet connection!" });
                setLoading(false);
            }

        });

    } else {
        displayMeals();
        setLoading(false);
    }
}

function displayMeals() {
    let root_element = document.getElementById("meals-collapsible");

    for(const [date, mealzz] of Object.entries(meals.data)) {
	var datum = new Date(date);
        // Create root element for a date entry
        let subject_entry = document.createElement("li");
        // Create subject collapsible header
        let subject_header = document.createElement("div");
        subject_header.classList.add("collapsible-header");
        subject_header.classList.add("collapsible-header-root");
        // Create header text element
        let subject_header_text = document.createElement("span");
        subject_header_text.innerText = jsDateDayString[datum.getDay()]+", "+datum.getDate()+". "+jsDateMonthString[datum.getMonth()]+" "+datum.getFullYear()+" ("+mealzz.meal+"@"
		+mealzz.location+")";

        // Create collection for displaying individuals meals
        let subject_body = document.createElement("div");
        subject_body.className = "collapsible-body";
        let subject_body_root = document.createElement("ul");
        subject_body_root.className = "collection";

        for(const [dindex, dmil] of Object.entries(mealzz.menu_options)) {
            // Create element for individual meal
            let meal_node = document.createElement("li");
            meal_node.className = "collection-item";
            meal_node.classList.add("collection-item")
            meal_node.classList.add("meal-node");
            meal_node.dataset["index"] = dindex;
	    meal_node.onclick = function () {
		setMenu(date, dmil.value);
	    }
            let meal_node_div = document.createElement("div");

            // Node for left text
            let meal_lefttext = document.createElement("span");
            // Node for the right text
            let meal_righttext = document.createElement("div");
            meal_lefttext.className = "secondary-content";

            // Apply different style, if the grade is temporary
            if (dmil.selected) {
                // Text
                meal_lefttext.innerHTML = "<i>"+dmil.text+"</i>";
                // Number
                meal_righttext.innerText = "selected";
            } else {
                // Text
                meal_lefttext.innerText = dmil.text;
                // Number
                meal_righttext.innerText = "";
            }

            meal_node_div.appendChild(meal_lefttext);
            meal_node_div.appendChild(meal_righttext);

            meal_node.appendChild(meal_node_div);


            subject_body_root.appendChild(meal_node);

        }

        subject_header.appendChild(subject_header_text);

        subject_body.append(subject_body_root);

        subject_entry.append(subject_header);
        subject_entry.append(subject_body);

        root_element.append(subject_entry);
    }

    $("#grades-collapsible").append(root_element);

    // refreshClickHandlers();
}

function clearMeals() {
    const table = document.getElementById("meals-collapsible");
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

function refreshMeals(force) {
    clearMeals();
    loadMeals(force);
}

function refreshClickHandlers() { // unused
    $("#meals-collapsible").find(".collection-item.meal-node").click(function () {
        let grade_obj = grades[parseInt(this.dataset["index"])];
        document.getElementById("grade-header").innerText = grade_obj["predmet"] + ": " + grade_obj["ocena"];
        document.getElementById("grade-date").innerText = grade_obj["datum"];
        document.getElementById("grade-title").innerText = grade_obj["naslov"];
        document.getElementById("grade-type").innerText = "Type: " + grade_obj["vrsta"];

        let term_element = document.getElementById("grade-term");
        if (grade_obj["rok"] !== "") {
            term_element.innerText = "Term: " + grade_obj["rok"];
            term_element.style["display"] = "";
        } else {
            term_element.style["display"] = "none";
        }

        document.getElementById("grade-teacher").innerText = "Teacher: " + grade_obj["profesor"];

        let temporary_object = document.getElementById("grade-temporary");
        let temporary_object_root = document.getElementById("grade-temporary-root");
        if (grade_obj["zacasna"]) {
            temporary_object.innerText = "(zacasna)";
            temporary_object_root.style["display"] = "";
        } else {
            temporary_object_root.style["display"] = "none";
        }

        const modal = document.querySelectorAll('.side-modal')[0];
        M.Sidenav.getInstance(modal).open();
    });
}

function lopolisLogout() {
	localforage.setItem("logged_in_lopolis", false);
	checkLogin();
}

function lopolisLogin() {
	setLoading(true);
	var usernameEl = document.getElementById("meals_username");
	var passwordEl = document.getElementById("meals_password");
	$.ajax({
		url: API_ENDPOINT+"gettoken",
		crossDomain: true,
		contentType: "application/json",
		data: JSON.stringify({"username": usernameEl.value, "password": passwordEl.value}),
		dataType: "json",
		cache: false,
		type: "POST",
		success: (data) => {
			if(data == null) {
                		M.toast({ html: "Request for Authentication failed!" });
		        	setLoading(false);
				usernameEl.value = "";
				passwordEl.value = "";
			} else if(data.error == true) {
				M.toast({html:"Authentication failed"});
				usernameEl.value = "";
				passwordEl.value = "";
				setLoading(false);
			} else {
         			localforage.setItem("logged_in_lopolis", true).then((value) => {
         			localforage.setItem("lopolis_username", usernameEl.value).then((value) => {
         			localforage.setItem("lopolis_password", passwordEl.value).then((value) => {
					setLoading(false);
					M.toast({html:"Credentials match!"});
					checkLogin();
                    		});
                    		});
                    		});
			}
		},
		error: () => {
			M.toast({html:"No internet connection!"});
			setLoading(false);
		}
	});
}
async function setMenu(date, menu) {
    setLoading(true);
    let promises_to_run = [
        localforage.getItem("lopolis_username").then((value) => {
            username = value;
        }),
        localforage.getItem("lopolis_password").then((value) => {
            password = value;
        })
    ];
    await Promise.all(promises_to_run);
	$.ajax({
		url: API_ENDPOINT+"gettoken",
		crossDomain: true,
		contentType: "application/json",
		data: JSON.stringify({"username": username, "password": password}),
		dataType: "json",
		cache: false,
		type: "POST",
		success: (dataauth) => {
			if(dataauth == null) {
                		M.toast({ html: "Request for Authentication failed!" });
		        	setLoading(false);
			        localforage.settItem("logged_in_lopolis", false).then(()=>{checkLogin();})
			} else if(dataauth.error == true) {
				M.toast({html:"Authentication failed"});
				setLoading(false);
			        localforage.settItem("logged_in_lopolis", false).then(()=>{checkLogin();})
			} else {
				$.ajax({
					url: API_ENDPOINT+"setmenus",
					crossDomain: true,
					contentType: "application/json",
					headers: {
						"Authorization": "Bearer "+dataauth.data
					},
					data: JSON.stringify({"choices": {[date]: menu}}),
					dataType: "json",
					cache: false,
					type: "POST",
					success: (data) => {
						if(data == null) {
			                		M.toast({ html: "Request for Setting the menu failed!" });
					        	setLoading(false);
						} else if(data.error == true) {
							M.toast({html:"Setting the menu errored out"});
							setLoading(false);
						} else {
							M.toast({html:"Success? It looks like one. Refresh the menus to be sure."});
							setLoading(false);
						}
					},
					error: () => {
						M.toast({html:"No internet connection! Are you fucking kidding me??!?!?!"});
						setLoading(false);
					}
				});

			}
		},
		error: () => {
			M.toast({html:"No internet connection!"});
			setLoading(false);
		}
	});
}

// Initialization code
document.addEventListener("DOMContentLoaded", async () => {
    checkLogin();

    let coll_elem = document.querySelectorAll('.collapsible');
    let coll_instance = M.Collapsible.init(coll_elem, {});

    // Setup refresh handler
    $("#refresh-icon").click(function () {
        refreshMeals(true);
    });

    let elems = document.querySelectorAll('.modal');
    let instances = M.Modal.init(elems, {});

    // Setup side menu
    const menus = document.querySelectorAll('.side-menu');
    M.Sidenav.init(menus, { edge: 'right', draggable: true });

    // Setup side modal
    const modals = document.querySelectorAll('.side-modal');
    M.Sidenav.init(modals, { edge: 'left', draggable: false });
    await loadMeals();
});
