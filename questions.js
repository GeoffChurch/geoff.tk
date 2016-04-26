var main=function(){
    initGrid(document.body);
    var grid=document.getElementById('grid');
    var rows=grid.children.length;
    var cols=grid.children[0].children.length;
    var xMult=cols/window.innerWidth;
    var yMult=rows/window.innerHeight;
    console.log(rows,cols);
    //document.getElementById('mainDiv').onmouseover=document.getElementById('grid').onmouseover;
    document.getElementById('mainDiv').onmousemove=function(e){
	document.getElementById('c'+Math.floor(e.clientY*yMult)+'_'+Math.floor(e.clientX*xMult)).dispatchEvent(new CustomEvent('mouseover'));
    };
}
window.onload=main;
