// game of life constants
var TIME=true;
var ROWS;
var COLS;
var cells;
var grid;
var glider=[[1],[2],[0,1,2]];
var setCell=function(row,col,val,time){
    row=normalize(row,ROWS);
    col=normalize(col,COLS);
    if(val){
	cells[row*COLS+col]|=time+1;
    }else{
	cells[row*COLS+col]&=(!time)+1;
    }
}
var normalize=function(val,max){
    return (max+(val%max))%max;
}
var getCell=function(row,col,time){
    row=normalize(row,ROWS);
    col=normalize(col,COLS);
    return (cells[row*COLS+col]&(time+1))>>time;
}

var setCells=function(row,col,time,shape){
    for(var ri=0;ri!=shape.length;ri++){
	r=shape[ri];
	for(var ci=0;ci!=r.length;ci++){
	    var tr=row+ri,tc=col+r[ci];
	    setCell(tr,tc,true,time);
	    setCellDisplay(tr,tc,true);
	}
    }
}

var mouseoverCell=function(e){
    var row=e.target.row,col=e.target.col;
    setCell(e.target.row,e.target.col,true,TIME);
    setCellDisplay(row,col,true);
}

var clickCell=function(e){
    var row=e.target.row,col=e.target.col;
    setCells(row,col,TIME,glider);
}

var initGrid=function(domTarget){
    ROWS=15;
    COLS=Math.round(ROWS*window.innerWidth/window.innerHeight);
    cells=new Uint8Array(ROWS*COLS);
    grid=document.createElement('table');
    grid.id='grid';
    var rows=document.createDocumentFragment();
    for(var i=0;i!=ROWS;i++){
	var cols=document.createDocumentFragment();
	for(var j=0;j!=COLS;j++){
	    var cell=document.createElement('td');
	    cell.row=i;
	    cell.col=j;
	    cell.id='c'+i+'_'+j;
	    cell.onmouseover=mouseoverCell;
	    cell.onclick=clickCell;
	    cols.appendChild(cell);
	}
	var row=document.createElement('tr');
	row.appendChild(cols);
	rows.appendChild(row);
    }
    grid.appendChild(rows);
    domTarget.appendChild(grid);
    setCells(0,6,TIME,glider);
    setInterval(gameStep,100);
}

var getNeighbors=function(row,col){
    var ret=[];
    for(var r=row-1;r!=row+2;r++){
	for(var c=col-1;c!=col+2;c++){
	    if(r!=row||c!=col){
		ret.push([r,c]);
	    }
	}
    }
    return ret;
}

var setCellDisplay=function(row,col,val){
    row=normalize(row,ROWS);
    col=normalize(col,COLS);
    document.getElementById('c'+row+'_'+col).className=val?'live':'';
}

var updateGrid=function(time){
    for(var row=0;row!=ROWS;row++){
	for(var col=0;col!=COLS;col++){
	    setCellDisplay(row,col,getCell(row,col,time));
	}
    }
}

var map=function(f,arr){
    for(var i=0;i!=arr.length;i++){
	arr[i]=f(arr[i]);
    }
    return arr;
}

var sum=function(arr){
    ret=0;for(var i=0;i!=arr.length;i++)ret+=arr[i];return ret;
}

var getCellFromCoords=function(coords){
    return getCell(coords[0],coords[1],TIME);
}

var gameStep=function(){
    for(var row=0;row!=ROWS;row++){
	for(var col=0;col!=COLS;col++){
	    nVal=sum(map(getCellFromCoords,getNeighbors(row,col)));
	    if(nVal<2){
		setCell(row,col,false,!TIME);
	    }else if(nVal==2){
		setCell(row,col,getCell(row,col,TIME),!TIME);
	    }else if(nVal==3){
		setCell(row,col,true,!TIME);
	    }else{
		setCell(row,col,false,!TIME);
	    }
	}
    }
    for(var row=0;row!=ROWS;row++){
	for(var col=0;col!=COLS;col++){
	    setCell(row,col,false,TIME);
	}
    }
    TIME^=true;
    updateGrid(TIME);
}
