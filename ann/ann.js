var T;
var learning_rule;
var setTopology;
//these need to be pulled in from the document by ID
var graph;
var population_control;
//var density_control;
var period_control;
var min_charge_control;
var max_charge_control;
var learning_rule_control;
var topology_control;
//
var defs; // holds marker for arrow-lines
window.onload=function(){
    connectToDoc();
    setLearningRule();
    setTopologyF();
    initNet();
    (function clock(){
	step();
	window.setTimeout(clock,period_control.value);
    })();
    //setInterval(step, 1000);
}

var step=function(){
    for (var i=0;i!=neurons.length;i++){
	var neuron=neurons[i];
	var output=neuron.f(neuron.charge[T?1:0]);
	neuron.img.setAttribute('r',4+20*Math.abs(output));
	neuron.img.setAttribute('fill',output<0?'red':'blue');
	for (var j=0;j!=neuron.outputs.length;j++){
	    var synapse=neuron.outputs[j];
	    synapse.dst.charge[T?0:1]+=synapse.weight*output;
	    //synapse.weight+=synapse.dst.f(synapse.dst.charge[T?0:1]);
	    learning_rule(synapse);
	    //synapse.img.setAttribute('stroke','0000FF');//,synapse.weight<0?'red':'blue'); // DOESN'T WORK
	}
	neuron.charge[T?1:0]=0.0;
    }
    T^=true;
}
var addE=function(type,html,target){
    var e=document.createElement(type);
    if(html)e.innerHTML=html;
    if(target)target.appendChild(e);
    else document.body.appendChild(e);
    return e;
}
var connectToDoc=function(){
    var getE=(id)=>document.getElementById(id);
    graph=getE('graph');
    population_control=getE('population_control');
    //density_control=getE('density_control');
    period_control=getE('period_control');
    min_charge_control=getE('min_charge_control');
    max_charge_control=getE('max_charge_control');
    learning_rule_control=getE('learning_rule_control');
    topology_control=getE('topology_control');
}
var addInput=function(type,label,props,target,val){
    var d=document.createElement('div');
    var e=document.createElement('input');
    e.type=type;
    e.id=label;
    if(props){
	for (var key in props){
	    e[key]=props[key];
	}
    }
    d.appendChild(e);
    var lab=document.createElement('label');
    lab.for=label;
    lab.innerHTML=label;
    d.appendChild(lab);
    target.appendChild(d);
    return e;
}
var stimulate=function(){
    console.log('stimulate!');
    var val=parseFloat(stimulusControl.value);
    console.log(val);
    for(var i=0;i!=neurons.length;i++){
	neurons[i].charge[T?1:0]+=val;
    }
}
var setTopologyF=function(){
    eval('setTopology=function(neurons){'+topology_control.value+'};');
}
var resetTopology=function(){
    setPopulation();
    console.log('setting connections');
    setTopology(neurons);
    console.log('updating graph');
    updateGraph();
}
var initNet=function(){
    T=false;
    console.log('initNet');
    neurons=[];
    clicked=null;
    /*
    //add population_control
    population_control=addInput('number','number of neurons',{'value':33},document.body);
    //add density_control
    density_control=addInput('number','synapse probability',{'step':'any','min':0,'max':1,'value':0.05},document.body);
    var b=addE('button','reset topology');
    b.onclick=resetTopology;
    //add charge_control
    stimulusMinControl=addInput('number','minimal charge',{'step':'any','min':-1,'max':1,'value':-1.0},document.body);
    stimulusMaxControl=addInput('number','maximal charge',{'step':'any','min':-1,'max':1,'value':1.0},document.body);
    //add stimulus button
    var b=addE('button','reset charges');
    b.onclick=resetCharges;
    //add period_control
    period_control=addInput('number','step period',{'min':0,'value':100},document.body);
    //add learningFControl
    addE('p',LEARNING_RULE_TXT[0]);
    learningFControl=document.createElement('textarea');
    learningFControl.style.marginLeft='4em';
    //learningFControl.rows=0;
    document.body.appendChild(learningFControl);
    addE('p','}');*/
    //add graph
    var ns='http://www.w3.org/2000/svg';
    //graph=document.createElementNS(ns,'svg');
    console.log('wh:',window.innerWidth,window.innerHeight);
    radius=Math.min(window.innerWidth,window.innerHeight)/2.2;
    graph.setAttribute('width',radius*2.2);
    graph.setAttribute('height',radius*2.2);
    console.log(radius);
    //add svg elements
    defs=document.createElementNS(ns,'defs');
    //defs.innerHTML='<linearGradient id=\'grad\'><stop stop-color=\'black\'/><stop offset=\'100%\' stop-color=\'magenta\'/></linearGradient>'
    var marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'triangle');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '0');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('markerWidth', '40');
    marker.setAttribute('markerHeight', '30');
    marker.setAttribute('orient', 'auto');
    var path=document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    marker.appendChild(path);
    defs.appendChild(marker);
    graph.appendChild(defs);
    console.log('defs');
    /*graph.style.position='fixed';
      graph.style.top=0;
      graph.style.left=0;*/
    //document.body.appendChild(graph);
    console.log('setting topology');
    resetTopology();
    console.log('setting charges');
    resetCharges();
    console.log('displaying graph');
    updateGraph();
    console.log('yo.');
}
var resetCharges=function(){
    for(var i=0;i!=neurons.length;i++){
	neurons[i].charge[T?1:0]=randRange(parseFloat(min_charge_control.value),parseFloat(max_charge_control.value));
    }
}
var randRange=function(lo,hi){
    return Math.random()*(hi-lo)+lo
}
var randIntRange=function(lo, hi) {
    return Math.floor(randRange(lo,hi));
}
var randIntRangeExcs=function(lo,excs,hi){
    var r=randIntRange(lo,hi-excs.length);
    for(var j=0;j!=excs.length;j++){
	//binary search would 
	if(r>=excs[j]){
	    r++;
	}
    }
    return r;
}

var randIntRangeExcsSorted=function(lo,excs,hi){ // binary search version of randIntRangeExcs
    var r=randIntRange(lo,hi-excs.length);
    var lo=0,hi=excs.length-1;
    while(lo<=hi){
	var curI=(lo+hi)>>>1;
	if(r>=excs[curI]){
	    r+=1+curI-lo;
	    lo=curI+1;
	}else{
	    hi=curI-1;
	}
    }
    return r;
}
var binIndex=function(arr,lo,hi,x){
    /**
       for a full search:
       lo=0
       hi=arr.length-1
    */
    while(lo<=hi){
	var curI=(lo+hi)>>>1;
	var cur=arr[curI];
	if(cur<x){
	    lo=curI+1;
	}else if(cur>x){
	    hi=curI-1;
	}else{
	    return curI;
	}
    }
    return ~hi;
}


var randomizeConnections=function(){
    for(var i=0;i!=neurons.length;i++){
	var neuron=neurons[i];
	neuron.inputs=[];
	neuron.outputs=[];
    }
    var prob=parseFloat(density_control.value);
    for(var i=0;i!=neurons.length;i++){
	var neuron=neurons[i];
	//console.log('r0:',r);
	//newSynapse(neuron,neurons[randIntRangeExcs(0,[],neurons.length)]); // we need at least one synapse
	//newSynapse(neurons[randIntRangeExcs(0,[],neurons.length)],neuron); // optionally exclude self
	for(var j=0;j!=neurons.length;j++){
	    if(Math.random()<prob){
		newSynapse(neuron,neurons[j]);
		//var r=randIntRangeExcs(0,Array.concat([i],neuron.outputs),neurons.length);
		//console.log('r:',r);
		//newSynapse(neuron,neurons[r]);
	    }
	}
    }
}
var setPopulation=function(){
    console.log('yep');

    var oldVal=neurons.length;
    console.log('oldval',oldVal);
    var newVal=parseInt(population_control.value);
    console.log('newval',newVal);
    for(var i=newVal;i<oldVal;i++){// delete neurons
	console.log('remneur');
	remNeuron(neurons.length-1);
    }
    for(var i=oldVal;i<newVal;i++){ // or add them
	console.log('newneur');
	newNeuron();
    }
    console.log('len:',neurons.length);
}
var updateGraph=function(){
    console.log('resetting graph'); // crash
    while (graph.firstChild) { // crash
	graph.removeChild(graph.firstChild);
    }
    graph.appendChild(defs);
    var nlen=neurons.length;
    var fact=2*Math.PI/nlen;
    for(var ni=0;ni<nlen;ni++){
	console.log('loop1');
	//set neuron x and y
	var pt=fact*ni;
	var cx=30+radius*(Math.cos(pt)+1);
	var cy=30+radius*(Math.sin(pt)+1);
	var svg=neurons[ni].img;
	svg.setAttribute('cx',cx);
	svg.setAttribute('cy',cy);
    }
    for(var ni=0;ni<nlen;ni++){
	//set and paint edges
	var neuron=neurons[ni];
	var nimg=neuron.img;
	var cx=nimg.getAttribute('cx');
	var cy=nimg.getAttribute('cy');
	var outs=neuron.outputs;
	for(var j=0;j<outs.length;j++){
	    var synapse=outs[j];
	    var s_img=synapse.img;
	    var dst_img=synapse.dst.img;
	    s_img.setAttribute('x1',cx);	
	    s_img.setAttribute('y1',cy);	
	    s_img.setAttribute('x2',dst_img.getAttribute('cx'));	
	    s_img.setAttribute('y2',dst_img.getAttribute('cy'));
	    graph.appendChild(s_img);
	}
    }
    for(var ni=0;ni<nlen;ni++){ // this has to be a new loop so that neurons are painted in front of all synapses // crash
	graph.appendChild(neurons[ni].img);
    }
    console.log('updateGraph finished!');
}
var setLearningRule=function(){
    eval('learning_rule=function(synapse){'+learning_rule_control.value+'};');
}
var newNeuron=function(){
    var ns='http://www.w3.org/2000/svg';
    svg=document.createElementNS(ns,'circle');
    svg.setAttribute('r',10);
    svg.onclick=nClick;
    neuron={charge:[0.0,0.0],inputs:[],outputs:[],f:Math.tanh,img:svg};
    svg.setAttribute('neuron_index',neurons.length);
    neurons.push(neuron);
}
var remNeuron=function(index){
    var n=neurons.splice(index,1)[0];
    var ins=n.inputs;
    while(ins.length!=0){
	remSynapse(ins[0].src,n);
    }
}
var remSynapse=function(src,dst){ // TODO herein lies the problem
    var src_outputs=src.outputs;
    var dst_inputs=dst.inputs;
    for(var n=src_outputs.length-1;n>=0;n--){
	if(src_outputs[n].dst==dst){
	    src_outputs.splice(n,1);
	    break;
	}
    }
    for(var n=dst_inputs.length-1;n>=0;n--){
	if(dst_inputs[n].src==src){
	    dst_inputs.splice(n,1);
	    break;
	}
    }
}
var newSynapse=function(src,dst){ // TODO include weight parameter that defs to 1
    var ns='http://www.w3.org/2000/svg'; // do we need this now?
    svg=document.createElementNS(ns,'line');
    svg.setAttribute('stroke','black');
    svg.setAttribute('stroke-width',1);
    svg.setAttribute('marker-end','url(#triangle)');
    //svg.oncontextmenu=function(){alert('hello!');};
    synapse={weight:1.0,src:src,dst:dst,img:svg};
    src.outputs.push(synapse);
    dst.inputs.push(synapse);
}
var toggleSynapse=function(src,dst){
    var isPresent=false;
    var src_outputs=src.outputs;
    var dst_inputs=dst.inputs;
    for(var n=src_outputs.length-1;n!=-1;n--){
	if(src_outputs[n].dst==dst){
	    isPresent=true;
	    src_outputs.splice(n,1);
	    break;
	}
    }
    if(isPresent){
	for(var n=dst_inputs.length-1;n!=-1;n--){
	    if(dst_inputs[n].src==src){
		dst_inputs.splice(n,1);
		break;
	    }
	}
    }else{
	newSynapse(src,dst);
    }
}
var deleteAllSynapses=function(){
    for(var i=neurons.length-1;i!=-1;i--){
	var neuron=neurons[i];
	neuron.inputs=[];
	neuron.outputs=[];
    }
}
nClick=function(a){
    neuron=neurons[a.target.getAttribute('neuron_index')];
    console.log(neuron);
    if(clicked){
	toggleSynapse(clicked,neuron);
	updateGraph();
	clicked=null;
    }else{
	clicked=neuron;
    }
}

