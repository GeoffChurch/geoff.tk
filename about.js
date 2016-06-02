function submitForm(formData){ // just ignore response
    var xhr = new XMLHttpRequest();
    xhr.onload=function(e){
	console.log('ajax returned', e);
	document.getElementById('contactForm').reset();
    };
    xhr.open('POST', 'https://docs.google.com/forms/d/1Rg_XyGY3KDP-xVNVFEGcQVRfzuoYzNJFNeRyU35P4wU/formResponse?embedded=true', true);
    xhr.send(formData);
}

window.onload=function(){
    initGrid(document.body);
    passAlongEvents(document.getElementById('mainDiv'));
    document.getElementById('emailInput').onkeydown=function(e){
	if(e.keyCode==13){
	    e.preventDefault();
	    document.getElementById('submitLabel').onclick();
	    return false;
	}
    };
};   
