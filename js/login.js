
document.addEventListener("DOMContentLoaded",()=>{setupEventListeners();})
function setupEventListeners(){$("#login-button").click(()=>{login();});window.addEventListener("keyup",(event)=>{if(event.keyCode===13){event.preventDefault();login();}});}
function login(){let username=$("#username").val();let password=$("#password").val();var gsecInstance;try{gsecInstance=new gsec();}catch(error){$.ajax({url:'js/gsec.js?ajaxload',async:false,dataType:"script",});try{gsecInstance=new gsec();}catch(error){alert(D("browserNotSupported"));}}
gsecInstance.login(username,password).then((value)=>{if(typeof value=="string"){let promises_to_run=[localforage.setItem("logged_in",true),localforage.setItem("username",username),localforage.setItem("password",password)];Promise.all(promises_to_run).then(function(){window.location.replace("/pages/timetable.html");});}else{UIAlert("loginFailed");$("#password").val("");}}).catch((err)=>{gsecErrorHandlerUI(err);$("#password").val("");});}