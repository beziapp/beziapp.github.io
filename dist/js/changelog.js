
async function checkLogin(){localforage.getItem("logged_in").then(function(value){if(value!==true){window.location.replace("/index.html");}}).catch(function(err){console.log(err);});}
document.addEventListener("DOMContentLoaded",()=>{checkLogin();$("#nav-back-button").click(function(){window.location.replace("/pages/about.html");});var elems=document.querySelectorAll(".collapsible");M.Collapsible.init(elems,{});});