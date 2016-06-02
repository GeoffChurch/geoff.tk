//// game of life constants
var TIME = 1;
var ROWS = 128;
var COLS;
var cells;
var cEls;
var grid;

var tumbler = [[0,          6],
	       [  1,2,  4,5  ],
	       [    2,  4    ],
	       [0,          6],
	       [0,1,2,  4,5,6]];

var r_pentomino = [[   1, 2],
		   [0, 1   ],
		   [   1   ]];

var jub = [[0, 1, 2   ],
	   [   1, 2, 3]];

var square = [[0, 1],
	      [0, 1]];

var glider = [[   1   ],
	      [      2],
	      [0, 1, 2]];

var passAlongEvents = function(el){
    var xMult = COLS / window.innerWidth;
    var yMult = ROWS / window.innerHeight;
    el.onmousemove = function(e){
	cEls[Math.floor(e.clientY * yMult)][Math.floor(e.clientX * xMult)].dispatchEvent(new CustomEvent('mouseover'));
    };
};

var setCell = function(row, col, val, time){
    row = normalize(row, ROWS);
    col = normalize(col, COLS);
    if(val)
	cells[row*COLS + col] |= time + 1;
    else
	cells[row*COLS + col] &= (!time) + 1;
};

var normalize = function(val,max){
    return (max + (val % max)) % max;
};

var getCell = function(row, col, time){
    row = normalize(row, ROWS);
    col = normalize(col, COLS);
    return (cells[row * COLS + col] & (time + 1)) >> time;
};

var setCells = function(row,col,time,shape){
    for(var ri = 0; ri != shape.length; ri++){
 	r = shape[ri];
	for(var ci = 0; ci != r.length; ci++){
	    var tr = row + ri;
	    var tc = col + r[ci];
	    setCell(tr, tc, true, time);
	    setCellDisplay(tr, tc, true);
	}
    }
};

var mouseoverCell = function(e){
    var row = e.target.row, col = e.target.col;
    //setCell(e.target.row, e.target.col, true, TIME);
    setCells(row, col, TIME, tumbler);
    setCellDisplay(row, col, true);
}

var clickCell = function(e){
    var row = e.target.row, col = e.target.col;
    setCells(row, col, TIME, glider);
}

var initGrid = function(domTarget){
    COLS = Math.round(ROWS * window.innerWidth / window.innerHeight);
    cells = new Uint8Array(ROWS * COLS);
    grid = document.createElement('table');
    grid.id = 'grid';
    var rows = document.createDocumentFragment();
    cEls = new Array(ROWS);
    for(var i = 0; i != ROWS; i++){
	cEls[i] = new Array(COLS);
	var cols = document.createDocumentFragment();
	for(var j = 0; j != COLS; j++){
	    var cell = document.createElement('td');
	    cell.row = i;
	    cell.col = j;
	    //cell.id = 'c' + i + '_' + j;
	    cEls[i][j] = cell;
	    cell.onmouseover = mouseoverCell;
	    cell.onclick = clickCell;
	    cols.appendChild(cell);
	}
	var row = document.createElement('tr');
	row.appendChild(cols);
	rows.appendChild(row);
    }
    grid.appendChild(rows);
    domTarget.appendChild(grid);
    //setCells(0,6,TIME,glider);
    for(var i = 0; i != ROWS; i++)
	for(var j = 0; j != COLS; j++){
	    setCell(i, j, Math.random() > 0.5, TIME);
	}
    setInterval(gameStep,100);
}

var getNeighbors=function(row,col){
    var ret = [];
    for(var r = row - 1; r != row + 2; r++){
	for(var c = col - 1; c != col + 2; c++){
	    if(r != row || c != col){
		ret.push([r, c]);
	    }
	}
    }
    return ret;
}

var setCellDisplay=function(row,col,val){
    row=normalize(row, ROWS);
    col=normalize(col, COLS);
    cEls[row][col].className = val ? 'l' : '';
    //document.getElementById('c'+row+'_'+col).className=val?'l':'';
}

var updateGrid=function(time){
    for(var row=0;row!=ROWS;row++){
	for(var col=0;col!=COLS;col++){
	    setCellDisplay(row,col,getCell(row,col,time));
	}
    }
}

var map=function(f,arr){
    for(var i = 0;i != arr.length; i++){
	arr[i] = f(arr[i]);
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
    for(var row = 0; row != ROWS; row++){
	for(var col = 0; col != COLS; col++){
	    nVal = sum(map(getCellFromCoords, getNeighbors(row, col)));
	    if(nVal < 2)
		setCell(row, col, false, !TIME);
	    else if(nVal == 2)
		setCell(row, col, getCell(row, col, TIME), !TIME);
	    else if(nVal == 3)
		setCell(row, col, true, !TIME);
	    else
		setCell(row, col, false, !TIME);
	}
    }
    for(var row = 0; row != ROWS; row++){
	for(var col = 0; col != COLS; col++){
	    setCell(row, col, false, TIME);
	}
    }
    TIME^=true;
    updateGrid(TIME);
}
