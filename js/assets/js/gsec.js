// tab = 2 || any spaces; use tabs
// not tested yet -- NOTE: document.createElement is xssy, use DOMParser!
var gseAbsenceTypes = ["notProcessed", "authorizedAbsence", "unauthorizedAbsence", "doesNotCount"];

function getStringBetween(string, start, end) {
    return string.split(start).pop().split(end)[0];
}

function stripHtml(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

function slDayToInt(inputString) { // wtf
    let fourChars = inputString.substring(1, 5);
    let fourCharDays = ["oned", "orek", "reda", "etrt", "etek", "obot", "edel"];
    return fourCharDays.indexOf(fourChars);
}

const GSE_URL = "https://zgimsis.gimb.tk/gse/";
const GSEC_ERR_NET = "GSEC NETWORK ERROR (ajax error)";
const GSEC_ERR_NET_POSTBACK_GET = "GSEC NETWORK ERROR (ajax error) in postback GET"
const GSEC_ERR_NET_POSTBACK_POST = "GSEC NETWORK ERROR (ajax error) in postback POST"
const GSEC_MSGTYPE_RECEIVED = 0;
const GSEC_MSGTYPE_SENT = 1;
const GSEC_MSGTYPE_DELETED = 2;
const GSEC_ERR_LOGIN = "GSEC LOGIN ERROR";
const GSEC_NO_ABSENCES = "noAbsences";
const GSEC_MSGTYPES = ["msgReceived", "msgSent", "msgDeleted"];

class gsec {

    constructor() {
    }

    parseAndPost(inputHTML, params, formId = null, useDiffAction = null) {
        return new Promise((resolve, reject) => {
            let parser = new DOMParser();
            let parsed = parser.parseFromString(inputHTML, "text/html");

            var form;
            if (formId == null) {
                form = parsed.getElementsByTagName("form")[0];
            } else {
                form = parsed.getElementById(formId);
            }

            var otherParams = $(form).serializeArray();
            for (const input of otherParams) {
                if (!(input.name in params)) {
                    params[input.name] = input.value; // so we don't overwrite existing values
                }
            }
        
            var action;
            if (useDiffAction == null || useDiffAction == false) {
                action = new URL($(form).attr("action"), GSE_URL); // absolute == relative + base
            } else {
                action = useDiffAction;
            }

            $.ajax({
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                url: action,
                cache: false,
                type: "POST",
                data: params,
                dataType: "text",
                success: (postData, textStatus, xhr) => {
                    resolve({data: postData, textStatus: textStatus, code: xhr.status});
                },
                error: () => {
                    reject(new Error(GSEC_ERR_NET_POSTBACK_POST));
                }
            });
        });
    }

    postback(getUrl, params = {}, formId = null, useDiffAction = null) {
        return new Promise( (resolve, reject) => {
            $.ajax({
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                url: getUrl,
                cache: false,
                type: "GET",
                dataType: "html",
                success: (data) => {
                    if (useDiffAction == true) {
                        useDiffAction = getUrl;
                    }
                    this.parseAndPost(data, params, formId, useDiffAction).then((value) => {
                        resolve(value);
                    });
                },
                error: () => {
                    reject(new Error(GSEC_ERR_NET_POSTBACK_GET));
                }
            });
        });
    }

    login(usernameToLogin, passwordToLogin) {
        return new Promise((resolve, reject) => {
            var dataToSend = {
                "edtGSEUserId": usernameToLogin,
                "edtGSEUserPassword": passwordToLogin,
                "btnLogin": "Prijava"
            };
            this.postback(GSE_URL + "Logon.aspx", dataToSend, null, true).then((response) => {
                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");
                if (response.code === 302) {
                    resolve(true);
                } else {
                    if (parsed.getElementById("lblMsg")) { // če obstaja lblMsg (napaka pri prijavi)
                        reject(new Error(GSEC_ERR_LOGIN));
                    } else if (!(parsed.getElementById("ctl00_lblLoginName"))) { // če ni ctl00_lblLoginName nismo na Default.aspx
                        reject(new Error(GSEC_ERR_LOGIN));
                    } else {
                        resolve(parsed.getElementById("ctl00_lblLoginName").innerHTML); // vrne ime dijaka, to je lahko uporabno
                    }
                }
            });
        });
    }

    fetchSessionData() {
        return new Promise((resolve, reject) => {
            $.ajax({
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                url: GSE_URL + "WS_Gim/wsGimSisUtils.asmx/GetSessionData",
                type: "POST",
                dataType: "json",
                cache: false,
                contentType: "application/json",
                data: "{}",
                processData: false,
                success: (data, textStatus, xhr) => {
                    var podatki = {};
                    podatki[0] = data.d.split(", ")[0];
                    podatki[1] = data.d.split(", ")[1];
                    podatki["username"] = data.d.split(", ")[1];
                    podatki[2] = data.d.split(", ")[2];
                    podatki[3] = data.d.split(", ")[3];
                    podatki["sessionCookie"] = data.d.split(", ")[3];
                    podatki[4] = data.d.split(", ")[4];
                    resolve({"data": podatki, "textStatus": textStatus, "code": xhr.status});
                },
                error: () => {
                    reject(new Error(false));
                }
            });
        });
    }

    fetchTeachersDirectory() {
        return new Promise((resolve, reject) => {
            var currentDate = new Date();
            // če je že po avgustu (september), uporabimo trenutno letnico
            // če še ni avgust uporabimo preteklo leto/letnico
            // skratka uporabi se prvi sklop številk v šolskem letu TOLE(XXXX/yyyy)
            var letnica = currentDate.getFullYear();
            if (currentDate.getMonth() < 7) {
                letnica--;
            }

            $.ajax({
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                url: GSE_URL + "Page_Gim/Uporabnik/modSporociloPrejemniki.aspx/NajdiOsebePrejemniki",
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                cache: false,
                data: JSON.stringify({
                    "aIdOsebeRe": "",
                    "aIdSolskoLeto": Number(letnica).toString(),
                    "aMsgType": "null",
                    "aIdType": "null",
                    "aIdUcitelj": "",
                    "aFilter": null
                }),
                // note about the nulls, "null"s and ""s: this is actually how zgimsisext2016 javascripts sends it.
                processData: false,
                success: (data) => {
                    var teachersDirectory = data.d.split(";"); // data.d je "12434=Ime Primek (učitelj);75353=Ime Drugega Priimek (učitelj)";
                    teachersDirectory.pop(); // pop, ker se string konča z ;
                    var formatted = {};
                    teachersDirectory.forEach((v) => {
                        formatted[v.split("=")[1].split(" (")[0]] = v.split("=")[0];
                    });
                    resolve(formatted);
                },
                error: () => {
                    reject(new Error(false));
                }
            });
        });
    }

    fetchTimetable(datum = null) {

        const SUBJECT_REGEX = /\((.+?)\)/;
        const ABKURZUNG_REGEX = /^(.+?) \(/;

        var dataToSend = datum == null ? {} : {
            "ctl00$ContentPlaceHolder1$wkgDnevnik_edtGridSelectDate": `${datum.getDate()}.${Number(datum.getMonth()+1)}.${datum.getFullYear()}`
        };

        return new Promise((resolve) => {
            var urnik = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6:{} } ;
            this.postback(GSE_URL+"Page_Gim/Ucenec/DnevnikUcenec.aspx", dataToSend, null, true).then((response) => {
                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");
                for (const urnikElement of parsed.querySelectorAll('*[id^="ctl00_ContentPlaceHolder1_wkgDnevnik_btnCell_"]')) {
                    var subFields = urnikElement.id.split("_");
                    var period = subFields[4];
                    var day = subFields[5];
                    var desc = $(urnikElement).attr("title").split("\n");
                    var subject = SUBJECT_REGEX.exec(desc[1])[1];
                    var abkurzung = ABKURZUNG_REGEX.exec(desc[1])[1];
                    var razred = desc[2];
                    var teacher = desc[3];
                    var place = desc[4];
                    urnik[day][period] = {
                        "subject": subject,
                        "acronym": abkurzung,
                        "class": razred,
                        "teacher": teacher,
                        "place": place
                    };
                }
                resolve(urnik);
            });
        });
    }

    fetchGradings() {

        const DESC_REGEX = /\((.+?)\)/m;
        const SUBJECT_REGEX = /^(.+?) \(/m;

        return new Promise((resolve) => {
            var gradings = [];
            this.postback(GSE_URL + "Page_Gim/Ucenec/IzpitiUcenec.aspx", {}, null, true).then( (response) => {

                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");

                var rowElements = parsed.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0].getElementsByTagName("tr");

                for (const row of rowElements) {
                    var subFields = row.getElementsByTagName("td");
                    var date = subFields[0].innerHTML.trim().split(".");
                    var dateObj = new Date(date[2]+"-"+date[1]+"-"+date[0]);
                    var rowSpan = subFields[1].getElementsByTagName("span")[0];
                    var abkurzung = "";

                    if (rowSpan) {
                        abkurzung = rowSpan.innerHTML.trim();
                    }

                    rowSpan.remove(); // magic
                    var subject = SUBJECT_REGEX.exec(subFields[1].innerHTML)[1].trim();
                    var desc = DESC_REGEX.exec(subFields[1].innerHTML)[1];

                    gradings.push({
                        "date": dateObj,
                        "acronym": abkurzung,
                        "subject": subject,
                        "description": desc
                    });
                }
                resolve(gradings);
            });
        });
    }

    fetchTeachers() { // razrednika ne vrne kot razrednika, če le-ta uči še en predmet. razlog: razrednik je napisan dvakrat, drugič se prepiše. Ne da se mi popravljat.

        const SUBJECT_REGEX = /^(.+?(?= \()|.+(?! \())/; // For some reason, JS doesn't support conditional regex
        const ABKURZUNG_REGEX = /\((.+)\)/;
        const DAY_REGEX = /^(.+?), /m;
        const PERIOD_REGEX = /, (\d+?)\. ura/;
        const TIME_RANGE_REGEX = /\((.+?) - (.+?)\)/;

        return new Promise((resolve) => {
            var Teachers = {};

            this.postback(GSE_URL + "Page_Gim/Ucenec/UciteljskiZbor.aspx", {}, null, true).then((response) => {

                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");

                var rowElements = parsed.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0].getElementsByTagName("tr");

                for (const row of rowElements) {
                    var subFields = row.getElementsByTagName("td");
                    var name = stripHtml(subFields[0].innerHTML); // razrednik je namreč bold tekst!
                    var subjectStrings = subFields[2].innerHTML.split("<br>");
                    var subjects = {};

                    for (const subjectString of subjectStrings) {
                        var subjectName = SUBJECT_REGEX.exec(stripHtml(subjectString))[1];
                        var abkurzung = ABKURZUNG_REGEX.exec(stripHtml(subjectString));
                        abkurzung = abkurzung == null ? subjectName : abkurzung[1];
                        subjects[abkurzung] = subjectName;
                    }

                    var TP = {};
                    TP.day = slDayToInt(DAY_REGEX.exec(subFields[3].innerHTML)[1]);
                    TP.period = Number(PERIOD_REGEX.exec(subFields[3].innerHTML)[1]);
                    var time_range_matches = TIME_RANGE_REGEX.exec(subFields[3].innerHTML);
                    TP.from = time_range_matches[1];
                    TP.till = time_range_matches[2];
                    if (TP.day < 0) { // indexOf vrne -1, če v arrayu ne najde dneva (&nbsp;)
                        TP = false;
                    }

                    Teachers[name] = { "subjects" : subjects , "tpMeetings" : TP };
                }
                resolve(Teachers);
            });
        });
    }

    sendMessage(recipient, subject = " ", body = " ") {
        return new Promise((resolve) => {
            var dataToSend = {
                "ctl00$ModalMasterBody$edtPrejemniki": "",
                "ctl00$ModalMasterBody$edtZadeva": subject,
                "ctl00$ModalMasterBody$edtBesediloExt": he.encode(body, {useNamedReferences: true}),
                "__EVENTTARGET": "ctl00$ModalMasterBody$btnDogodekShrani",
                "__EVENTARGUMENT": "",
                "ctl00$ModalMasterBody$hfPrejemniki": recipient
            };
            this.postback(GSE_URL+"Page_Gim/Uporabnik/modSporocilo.aspx?params=", dataToSend, null, true).then(() => {
                resolve(null);
            });
        });
    }

    deleteMessage(id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                url: GSE_URL + "Page_Gim/Uporabnik/Sporocila.aspx/DeleteMessage",
                type: "POST",
                dataType: "json",
                cache: false,
                contentType: "application/json",
                data: JSON.stringify({
                    "aIdSporocilo": id.split("|")[0],
                    "aIdZapis": id.split("|")[1]
                }),
                processData: false,
                success: (data) => {
                    if(data.d == true) {
                        resolve(true);
                    } else {
                        reject(new Error(false));
                    }
                },
                error: () => {
                reject(new Error(GSEC_ERR_NET));
                }
            });
        });
    }

    fetchAbsences(fromDate = null, tillDate = null) { // navedba datumov je deprecated. Internet je dovolj hiter za poslat maksimalno 4160 ur (16 ur/dan, 5 dni/ted, 52 ted/leto)

        const SUBJECT_LIST_REGEX = /(.+? \(<span class="opr\d">\dP?<\/span>\))(?:,\s*|$)/g;
        const FIELDS_REGEX = /^(.+?) \(<span class="opr(\d)">(\dP?)<\/span>\)/;

        return new Promise((resolve) => {
            if (!(fromDate instanceof Date) || !(tillDate instanceof Date)) {
                tillDate = new Date(Date.UTC(9999, 11, 30)); // overkill? Of course not, cez 8000 let bo ta app se vedno top shit
                fromDate = new Date(Date.UTC(1, 1, 1)); // i don't think so
            }

            var dataToBeSent = {
                "ctl00$ContentPlaceHolder1$edtDatZacetka": `${fromDate.getDay()}.${fromDate.getMonth()}.${fromDate.getFullYear()}`,
                "ctl00$ContentPlaceHolder1$edtDatKonca": `${tillDate.getDay()}.${tillDate.getMonth()}.${tillDate.getFullYear()}`,
            };

            this.postback(GSE_URL+"Page_Gim/Ucenec/IzostankiUcenec.aspx", dataToBeSent, null, true).then((response) => {
                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");

                try {
                    var rowElements = parsed.getElementById("ctl00_ContentPlaceHolder1_gvwIzostankiGroup").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
                } catch (err) {
                    resolve(GSEC_NO_ABSENCES);
                }

                var absences = [];
                 for (const izostanek of rowElements) {
                    var subFields = izostanek.getElementsByTagName("td");
                    var date = subFields[0].innerHTML.trim().split(".");
                    var dateObj = new Date(Date.parse(`${date[2]}-${date[1]}-${date[0]}`));

                    var subjects = [];
                    subFields[2].innerHTML.match(SUBJECT_LIST_REGEX).forEach((subject) => {
                        subjects.push(subject);
                    });

                    var absencesBySubject = {};

                    for (const subject of subjects) {
                        const matched_info = FIELDS_REGEX.exec(subject);

                        var subjectName = matched_info[1];
                        var status = Number(matched_info[2]);
                        // statusi so: 0: ni obdelano, 1: opravičeno, 2: neopravičeno, 3: ne šteje, uporabi S(gseAbsenceTypes[num]) za i18n prevod
                        // Ce je v "stevilki" P, gre za popoldansko uro -> +7 ur
                        var period = matched_info[3];
                        period = period.includes("P") ? Number(period.replace("P", "")) + 7 : Number(period);
                        absencesBySubject[period] = {status: status, subject: subjectName};
                    }
                    absences.push({subjects: absencesBySubject, date: dateObj});
                }
                resolve(absences);
            });
        });
    }

    fetchGrades() {
        var grades = [];
        return new Promise((resolve, reject) => {
            $.ajax({
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                url: GSE_URL + "Page_Gim/Ucenec/OceneUcenec.aspx",
                cache: false,
                type: "GET",
                dataType: "html",
                processData: false,

                success: (data) => {

                    let parser = new DOMParser();
                    let parsed = parser.parseFromString(data, "text/html");

                    let gradeSpans = parsed.getElementsByClassName("txtVOcObd");
                    for (const grade of gradeSpans) {
                        var ist = grade.getElementsByTagName("span")[0].getAttribute("title").split("\n");
                        var date = ist[0].split(": ")[1].trim().split(".");
                        var dateObj = new Date(Date.parse(`${date[2]}-${date[1]}-${date[0]}`));
                        var teacher = ist[1].split(": ")[1].trim();
                        var subject = ist[2].split(": ")[1].trim();
                        var name = [];

                        name.push(ist[3].split(": ")[1].trim())
                        name.push(ist[4].split(": ")[1].trim())
                        name.push(ist[5].split(": ")[1].trim())

                        var gradeNumber = Number(grade.getElementsByTagName("span")[0].innerHTML);
                        var temporary = grade.getElementsByTagName("span")[0].classList.contains("ocVmesna");

                        var gradeToAdd = {
                            "date": dateObj,
                            "teacher": teacher,
                            "subject": subject,
                            "name": name,
                            "temporary": temporary,
                            "grade": gradeNumber
                        };

                        if (grade.getElementsByTagName("span").length > 1) {
                            if(grade.getElementsByTagName("span")[1].classList.contains("ocVmesna")) {
                                gradeToAdd["temporary"] = true;
                            } else {
                                gradeToAdd["temporary"] = false;
                            }
                            gradeToAdd["grade"] = Number(grade.getElementsByTagName("span")[1].innerHTML);
                            gradeToAdd["oldgrade"] = Number(grade.getElementsByTagName("span")[0].innerHTML);
                        }
                        grades.push(gradeToAdd);

                    }
                    resolve(grades);
                },
                error: () => {
                    reject(new Error(GSEC_ERR_NET));
                }
            });
        });
    }

    fetchMessageOld(selectId) { // ne dela, glej fix spodaj (fetchMessage)

        const TIME_REGEX = / \(.+ (.+?)\)/;
        const DATE_REGEX = / \(.+? /;
        const SENDER_REGEX = /^(.+?) \(/;

        var message;
        return new Promise((resolve) => {
            var dataToBeSent = {
                "__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila",
                "__EVENTARGUMENT": "Select$" + selectId
            };

            this.postback(GSE_URL+"Page_Gim/Uporabnik/Sporocila.aspx", dataToBeSent, null, true).then((response) => {
                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");
                let subject = parsed.getElementsByClassName("msgSubjectS")[0].innerHTML.trim();
                let body = parsed.getElementsByClassName("gCursorAuto")[0].innerHTML.trim();
                let sender = SENDER_REGEX.exec(parsed.querySelectorAll("[id$=Label7]")[0].innerHTML)[1];
                let recipient = parsed.querySelectorAll("[id$=Label8]")[0].innerHTML;
                var date = DATE_REGEX.exec(parsed.querySelectorAll("[id$=Label7]")[0].innerHTML)[1];
                var tume = TIME_REGEX.exec(parsed.querySelectorAll("[id$=Label7]")[0].innerHTML)[1]; // "tume"!
                var dateObj = new Date(Date.parse(`${date[2]}-${date[1]}-${date[0]} ${tume}`)); // "tume"!
                var msgId = parsed.getElementById("ctl00_ContentPlaceHolder1_hfIdSporocilo").getAttribute("value");
                message = {
                    "subject": subject,
                    "body": body,
                    "sender": sender,
                    "recipient": recipient,
                    "date": dateObj,
                    "msgId": msgId
                };
                resolve(message);
            });
        });
    }

    fetchMessagesLastPageNumber(category = GSEC_MSGTYPE_RECEIVED) {
        var msgCategory = GSEC_MSGTYPES[category];
        return new Promise((resolve) => {
            var dataToBeSent = {
                "ctl00$ContentPlaceHolder1$ddlPrikaz": msgCategory,
                "__EVENTARGUMENT": "Page$Last",
                "__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila"
            };
            this.postback(GSE_URL+"Page_Gim/Uporabnik/Sporocila.aspx", dataToBeSent, null, true).then((response) => {
                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");
                let currentPage;
                if (parsed.getElementsByClassName("pager").length == 0) { // pager is not shown, there is only page one.
                    currentPage = 1;
                } else {
                    currentPage = Number(parsed.getElementsByClassName("pager")[0].getElementsByTagName("span")[0].innerHTML);
                }
                resolve(currentPage);
            });
        });
    }

    fetchMessagesList(category = GSEC_MSGTYPE_RECEIVED, pageNumber = 1, outputResponse = false) { // outputResponse je probably za debug

        const DATE_REGEX = /(\d+?).(\d+?).(\d+?) /; // I'm lazy

        var msgCategory = GSEC_MSGTYPES[category];
        var messages = [];
        var requestURI = GSE_URL + "Page_Gim/Uporabnik/Sporocila.aspx";
        return new Promise((resolve) => {
            var dataToBeSent = {
                "ctl00$ContentPlaceHolder1$ddlPrikaz": msgCategory,
                "__EVENTARGUMENT": "Page$" + pageNumber,
                "__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila"
            };
            this.postback(requestURI, dataToBeSent, null, true).then((response) => {
                if (outputResponse === true) {
                    response.url = requestURI;
                    resolve(response);
                }

                let parser = new DOMParser();
                let parsed = parser.parseFromString(response.data, "text/html");
                let messageElements = parsed.getElementById("ctl00_ContentPlaceHolder1_gvwSporocila").getElementsByTagName("tbody")[0].getElementsByTagName("td");
                for (const messageElement of messageElements) {
                    let msgId = messageElement.getElementsByTagName("input")[0].value;
                    var date = DATE_REGEX.exec(messageElement.getElementsByClassName("msgSubDate")[0].innerHTML);
                    var today = new Date();

                    if (date[3] == undefined || date[2].length < 1) {
                        date[3] = today.getFullYear();
                    }

                    if (date[2] == undefined || date[2].length < 1) {
                        date[2] = today.getMonth() + 1;
                        date[1] = today.getDate();
                    }

                    var tume = messageElement.getElementsByClassName("msgSubDate")[0].innerHTML.split(" ")[1];
                    tume = tume ?? messageElement.getElementsByClassName("msgSubDate")[0].innerHTML;

                    var dateStringToParse = `${date[2]}-${date[1]}-${date[0]} ${tume}`;
                    var dateObj = new Date(Date.parse(dateStringToParse)); // "tume"!
                    var person = messageElement.getElementsByClassName("msgDir")[0].innerHTML;
                    var subject = messageElement.getElementsByClassName("msgSubject")[0].innerHTML;
                    messages.push({
                        "date": dateObj,
                        "sender": person,
                        "subject": subject,
                        "msgId": msgId
                    });
                }
                resolve(messages);
            });
        });
    }

    fetchMessage(category = GSEC_MSGTYPE_RECEIVED, pageNumber = 1, messageNumberOnPage = 0) {

        const TIME_REGEX = / \(.+ (.+?)\)/;
        const DATE_REGEX = / \((\d+?).(\d+?).(\d+?) /;
        const SENDER_REGEX = /^(.+?) \(/;
            
        return new Promise((resolve) => {
            this.fetchMessagesList(category, pageNumber, true).then( (value) => {
                this.parseAndPost(
                    value.data,
                    {
                        "__EVENTTARGET": "ctl00$ContentPlaceHolder1$gvwSporocila",
                        "__EVENTARGUMENT": "Select$" + messageNumberOnPage
                    },
                    null,
                    value.url
                ).then((response) => {

                    let parser = new DOMParser();
                    let parsed = parser.parseFromString(response.data, "text/html");
                    let subject = parsed.getElementsByClassName("msgSubjectS")[0].innerHTML.trim();
                    let body = parsed.getElementsByClassName("gCursorAuto")[0].innerHTML.trim();
                    let sender = SENDER_REGEX.exec(parsed.querySelectorAll("[id$=Label7]")[0].innerHTML)[1];
                    let recipient = parsed.querySelectorAll("[id$=Label8]")[0].innerHTML;
                    var date = DATE_REGEX.exec(parsed.querySelectorAll("[id$=Label7]")[0].innerHTML);
                    var tume = TIME_REGEX.exec(parsed.querySelectorAll("[id$=Label7]")[0].innerHTML)[1]; // "tume"!
                    var dateObj = new Date(Date.parse(`${date[3]}-${date[2]}-${date[1]} ${tume}`)); // "tume"!
                    var msgId = parsed.getElementById("ctl00_ContentPlaceHolder1_hfIdSporocilo").getAttribute("value");
                    var message = {
                        "subject": subject,
                        "body": body,
                        "sender": sender,
                        "recipient": recipient,
                        "date": dateObj,
                        "msgId": msgId
                    };
                    resolve(message);

                });
            });
        });
    }
}
