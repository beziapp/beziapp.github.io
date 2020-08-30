
async function checkLogin(){localforage.getItem("logged_in").then(function(value){if(value!==true){window.location.replace("/index.html");}}).catch(function(err){console.log(err);});}
document.addEventListener("DOMContentLoaded",()=>{checkLogin();const menus=document.querySelectorAll(".side-menu");M.Sidenav.init(menus,{edge:"right",draggable:true});});