var PROJECTS=[
    {name:'piano',href:'piano/piano.html'},
    {name:'brain',href:'ann/ann.html'},
    {name:'repos',href:'https://github.com/GeoffChurch/'},
];

// buttons
BUTTONS=[
    {
	innerHTML:'about',
	onclick:()=>navto('about.html'),
    },
    {
	innerHTML:'projects',
	onclick:()=>navto('https://github.com/GeoffChurch/'),
	/*onmouseenter:hoverProjects,
	onmouseleave:leaveProjects,*/
    },
    {
	innerHTML:'research',
	onclick:()=>navto('questions.html'),
    },
];

var delChildren=function(e){
    var last;
    while(last=e.lastChild)
	e.removeChild(last);
};

var initProjects=function(){
    var s = '';
    for(var i=0;i!=PROJECTS.length;i++){
	p = PROJECTS[i];
	s += '<a href="' + p.href + '">' + p.name + '</a><br>';
    }
    var f = document.createElement('template');
    f.innerHTML = s.substring(0, s.length - 4);
    PROJECTS = f;
};

var hoverProjects=function(e){
    var targ=e.target;
    delChildren(targ);
    targ.appendChild(document.importNode(PROJECTS.content,true));
};

var leaveProjects=function(e){
    e.target.innerHTML='projects';
};

var navto=function(url){
    window.location=url;
};

var initButtons=function(){
    var buttonArea=document.createElement('div');
    buttonArea.id='buttonArea';
    for(var i = 0;i != BUTTONS.length;i++){
	var data = BUTTONS[i];
	button = document.createElement('div');
	button.align = 'center';
	//button.style.width=80/BUTTONS.length+'%';
	button.className = 'link';
	//var a=document.createElement('a');
	for(var prop in data){
	    button[prop] = data[prop]
	}
	//button.appendChild(a);
	buttonArea.appendChild(button);
    }
    document.body.appendChild(buttonArea);
    var maxWidth=Math.max.apply(null,Array.prototype.slice.call(buttonArea.childNodes,0).map((e)=>e.clientWidth));
    for(var i = 0;i != BUTTONS.length;i++){
    	buttonArea.children[i].style.width = maxWidth + 'px';
    }
}

window.onload = function(){
    initProjects();
    initButtons();
    initGrid(document.body);
    passAlongEvents(document.getElementById('buttonArea'));
};
