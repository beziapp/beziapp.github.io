
function getUrlParameter(sParam){const url_params=new URLSearchParams(window.location.search);const found_param=url_params.get(sParam);return found_param===null?"":found_param;}
localforage.getItem("logged_in").then(function(value){if(value==null){setupStorage(true);window.location.replace("/login.html");}else if(value===false){window.location.replace("/login.html");}else{if(getUrlParameter("m")!==""){window.location.replace("/pages/messaging.html#"+getUrlParameter("m"));}else{window.location.replace("/pages/timetable.html");}}}).catch(function(err){console.log(err);});