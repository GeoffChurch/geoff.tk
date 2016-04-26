//TODO let users define rhythms
function drawBuffer(data) {
    var $canvas = document.getElementById("myCanvas");
    var width = $canvas.width, height = $canvas.height;
    var context = $canvas.getContext('2d');
    var step = Math.ceil(data.length / width);
    var amp = height/2;
    context.fillStyle = '#5555ff';
    context.clearRect(0, 0, width, height);
    for (var i = 0; i < width; i++) {
        var min = 1.0;
        var max = -1.0;
        for (j = 0; j < step; j++) {
            var datum = data[(i * step) + j];
            if (datum < min)
                min = datum;
            if (datum > max)
                max = datum;
        }
        context.fillRect(i, (1 + min) * amp, 5, Math.max(1, (max - min) * amp));
    }
    context.fillStyle='#000000';
    context.textAlign='center';
    context.font='italic normal normal '+height/4+'px fantasy';
    context.fillText('Synth Yo-self!',width/2,height/2,width);
}
var hidden = false;
var scrolling = false;
var scroller;
var octaveCount = 22;
var REVERB_DECAY = 1;
var audioContext;
var semitoneRatio = Math.pow(2, 1 / 12);
var toneBuffers=[]; // stores sounds that can be played
var rhythmBuffers=[]; // stores rhythms
var impulseBuffers=[]; // stores buffers used to convolve tones
var audioBuffer, rhythm1, rhythm2;
var rhythmABSN; // holds the current rhythm - gets nullified every switch
var mediaStreamAudioSourceNode;
var waveShaperNode;
var biquadFilterNode;
var scriptProcessorNode;
var pianoGainNode, rhythmGainNode;
var convolverNode, nullConvolverNode, roomConvolverNode, hallConvolverNode;
var echoDelayNode, echoGainNode;
var bufferSize = 2048;
var bufferSizeShift = Math.log(bufferSize) / Math.LN2;
var f32Buffers = [];
var recLen = 0;
var isPlaying = false;
var isRecording = false;
var mediaStream;
function getFields(obj) {
    var result = [obj];
    for (var id in obj) {
        try {
            result.push(id + ": " + obj[id].toString() + '\n');
        } catch (err) {
            result.push(id + ": inaccessible\n");
        }
    }
    console.log(result);
}
window.onload = function () {
    document.title="Synth Yo-self!";
    //create the HTML piano
    var $keyBoard = $('#keyBoard')[0];
    createPiano($keyBoard);
    //connect HTML input forms to the set function
    $("input[type='range']").on('input', function () {
        $('#' + this.id + 'O').html(this.value);
        set(this.id, this.value);
    });
    /*    $('input:checkbox').on('change', function () {
          set(this.id, this.checked);
	  });*/
    $("input[type=radio]").change(function () {
        set(this.name, this.value);
    });
    /*
      var $body = $('body');
      $keyBoard.onmouseout=function(e){
      if(scrolling){
      scrolling=false;
      clearInterval(scroller);
      }
      };
      $keyBoard.onmousemove = function (e) {
      e = e.pageX;
      
      var currScroll = $body.scrollLeft();
      var onLeft = e < currScroll + 40, onRight = e > (window.outerWidth + currScroll - 40);
      if (!scrolling) {
      if (onLeft) {
      scroller = setInterval(function () {
      $body.scrollLeft($body.scrollLeft() - 4);
      }, 20);
      scrolling = true;
      } else if (onRight) {
      scroller = setInterval(function () {
      $body.scrollLeft($body.scrollLeft() + 4);
      }, 20);
      scrolling = true;
      }
      } else {
      if (!(onLeft || onRight)) {
      clearInterval(scroller);
      scrolling = false;
      }
      }
      };
    */

    var $keyBoard=$('#keyBoard')[0];
    $keyBoard.scrollLeft=$keyBoard.scrollWidth>>>1
    
    // set up record buttons
    var toneButtons=$('#toneButtons')[0];
    var toneRecButton=document.createElement('div');
    toneRecButton.onclick=function(){record(addToneBuffer);};
    toneRecButton.innerHTML='+';
    toneButtons.appendChild(toneRecButton);
    var rhythmButtons=$('#rhythmButtons')[0];
    var rhythmRecButton=document.createElement('div');
    rhythmRecButton.onclick=function(){record(addRhythmBuffer);};
    rhythmRecButton.innerHTML='+';
    rhythmButtons.appendChild(rhythmRecButton);
    var impulseButtons=$('#impulseButtons')[0];
    var impulseRecButton=document.createElement('div');
    impulseRecButton.onclick=function(){record(addImpulseBuffer);};
    impulseRecButton.innerHTML='+';
    impulseButtons.appendChild(impulseRecButton);

    // WEB AUDIO SECTION
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    //hook up biquadFilterNode
    biquadFilterNode = audioContext.createBiquadFilter();
    biquadFilterNode.type = 'highpass';
    biquadFilterNode.frequency.value = 0;
    biquadFilterNode.connect(audioContext.destination);
    //hook up echoDelayNode and echoGainNode (Everything goes through echoDelayNode)
    echoDelayNode = audioContext.createDelay(2);
    echoDelayNode.delayTime.value = 0;
    echoGainNode = audioContext.createGain();
    echoGainNode.gain.value = 0;
    echoDelayNode.connect(biquadFilterNode);
    echoDelayNode.connect(echoGainNode);
    echoGainNode.connect(echoDelayNode);
    //hook up waveShaperNode (distortion)
    waveShaperNode = audioContext.createWaveShaper();
    waveShaperNode.curve = new Float32Array(audioContext.sampleRate);
    //    waveShaperNode.oversample = '4x';
    makeDistortionCurve(0);
    waveShaperNode.connect(echoGainNode);
    waveShaperNode.connect(biquadFilterNode);
    //hook up dynamicsCompressorNode (distortion)
    //    dynamicsCompressorNode = audioContext.createDynamicsCompressor();
    //    dynamicsCompressorNode.attack.value = 0;
    //    dynamicsCompressorNode.knee.value = 0;
    //    dynamicsCompressorNode.ratio.value = 20;
    //    dynamicsCompressorNode.release.value = 0;
    //    dynamicsCompressorNode.threshold.value = 0;
    //    dynamicsCompressorNode.connect(echoDelayNode);
    //    dynamicsCompressorNode.connect(convolverNode);
    //    dynamicsCompressorNode.connect(biquadFilterNode);
    //hook up pianoGainNode
    pianoGainNode = audioContext.createGain();
    pianoGainNode.gain.value = 0.5;
    //pianoGainNode.connect(dynamicsCompressorNode);
    pianoGainNode.connect(waveShaperNode);
    //hook up rhythmGainNode
    rhythmGainNode = audioContext.createGain();
    rhythmGainNode.gain.value = 0.5;
    rhythmGainNode.connect(biquadFilterNode);
    //hook up convolver
    convolverNode=audioContext.createConvolver();
    echoDelayNode.connect(convolverNode);
    waveShaperNode.connect(convolverNode);
    convolverNode.connect(biquadFilterNode);
    
    // set up buffer selectors
    var toneButtons=$('#toneButtons')[0];
    loadFile('defaultSineA.ogg',function(b){addToneBuffer(b,'Sine');setToneBuffer('Sine');});
    loadFile('defaultSquareA.ogg',function(b){addToneBuffer(b,'Square');});
    loadFile('defaultSawA.ogg',function(b){addToneBuffer(b,'Saw');});
    var rhythmButtons=$('#rhythmButtons')[0];
    loadFile('rhythm1.ogg', function(b){addRhythmBuffer(b,'Badass');});
    loadFile('rhythm2.ogg', function(b){addRhythmBuffer(b,'Tinker');});
    var impulseButtons=$('#impulseButtons')[0];
    loadFile('irRoom.ogg',function(b){addImpulseBuffer(b,'Studio');});
    loadFile('irHall.ogg',function(b){addImpulseBuffer(b,'Hall');});
};

function addToneBuffer(buffer,name){
    addBuffer(buffer,name,toneBuffers,$('#toneButtons')[0],function(){setToneBuffer(name);});
}
function removeToneBuffer(name){
    removeAudioBuffer(name,toneBuffers,$('#toneButtons')[0]);
}
function setToneBuffer(name) {
    var newBuffer=toneBuffers[name];
    audioBuffer=copyBuffer(newBuffer);
    drawBuffer(newBuffer.getChannelData(0));

}
function addRhythmBuffer(buffer,name){
    addBuffer(buffer,name,rhythmBuffers,$('#rhythmButtons')[0],function(){setRhythmBuffer(name);});
}
function removeRhythmBuffer(name){
    removeAudioBuffer(name,rhythmBuffers,$('#rhythmButtons')[0]);
}
function setRhythmBuffer(name){
    if(rhythmABSN){
	rhythmABSN.stop();
	rhythmABSN.disconnect(rhythmGainNode);
    }
    rhythmABSN=audioContext.createBufferSource();
    rhythmABSN.buffer = rhythmBuffers[name];
    rhythmABSN.loop = true;
    rhythmABSN.connect(rhythmGainNode);
    rhythmABSN.start();
}
function addImpulseBuffer(buffer,name){
    addBuffer(buffer,name,impulseBuffers,$('#impulseButtons')[0],function(){setImpulseBuffer(name);});
}
function removeImpulseBuffer(name){
    removeAudioBuffer(name,impulseBuffers,$('#impulseButtons')[0]);
}
function setImpulseBuffer(name){
    convolverNode.buffer = impulseBuffers[name];
}

function addBuffer(newAudioBuffer,name,jsDest,domDest,onclick){
    jsDest[name]=newAudioBuffer;
    var newButton=document.createElement('div');
    newButton.onclick=onclick;
    newButton.oncontextmenu=function(){removeAudioBuffer(name,jsDest,domDest);return false;};
    newButton.innerHTML=name;
    domDest.appendChild(newButton);
}
function removeAudioBuffer(name,jsSrc,domSrc){
    delete jsSrc[name];
    var buttons=domSrc.childNodes;
    for(var i=buttons.length-1;i!=-1;i--){
	if(buttons[i].innerHTML===name){
	    domSrc.removeChild(buttons[i]);
	    return;
	}
    }
}

function makeDistortionCurve(k){
    var curve=waveShaperNode.curve;
    var deg = Math.PI / 180;
    var n_samples=curve.length;
    for (var i=0; i < n_samples; ++i ) {
	var x = (i<<1) / n_samples - 1;
	curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
	//	curve[i]=Math.tanh(x);
    }
}

function copyBuffer(buffer){
    var copy = audioContext.createBuffer(1, buffer.length, audioContext.sampleRate);
    f32Array = buffer.getChannelData(0);
    copy.getChannelData(0).set(f32Array, 0);
    return copy;
}

function loadFile(fileName, setFunction) {
    var request = new XMLHttpRequest();
    request.open('GET', fileName, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
        var incomingData = request.response;
        audioContext.decodeAudioData(incomingData, setFunction, function () {
	    alert('Error loading file: ' + setFunction);
        });
    };
    request.send();
}

function stopRecording(){
    mediaStreamAudioSourceNode.disconnect();
    scriptProcessorNode.disconnect();
    mediaStream.stop();
    isRecording = false;
    //WE CAN'T MODIFY THE ARRAY BECAUSE THE LENGTH WILL PROBLY B DIFF
    var finalArray = new Float32Array(recLen);//*Float32Array.BYTES_PER_ELEMENT;
    var audioBuffer = audioContext.createBuffer(1, recLen, audioContext.sampleRate);
    var offset = 0;
    for (var i = 0; i < f32Buffers.length; i++) {//for (var f32Array in f32Buffers) {
        var f32Array = f32Buffers[i];
        if (f32Array[0] !== 0.0)
	    console.log("OMGOMGOMG");
        finalArray.set(f32Array, offset);
        offset += f32Array.length;
    }
    audioBuffer.getChannelData(0).set(finalArray);
    return audioBuffer;
}

function startRecording(){
    console.log("started recording");
    recLen = 0;
    f32Buffers.length = 0;
    //get microphone input
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia({
        "audio": {
	    "mandatory": {
                "googEchoCancellation": "false",
                "googAutoGainControl": "false",
                "googNoiseSuppression": "false",
                "googHighpassFilter": "false"
	    },
	    "optional": []
        }
    }, function (inputStream) {//ON SUCCESS
        mediaStream = inputStream;
        //set up the input source node
        mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(inputStream);
        scriptProcessorNode = (audioContext.createScriptProcessor || audioContext.createJavaScriptNode).call(audioContext, bufferSize, 2, 2);
        scriptProcessorNode.onaudioprocess = function (newAudioBuffer) {
	    var channel0 = new Float32Array(newAudioBuffer.inputBuffer.getChannelData(0));
	    f32Buffers.push(channel0);
	    recLen += channel0.length;
        };
        //connect source node to intermediary nodes
        mediaStreamAudioSourceNode.connect(scriptProcessorNode);
        scriptProcessorNode.connect(audioContext.destination);
    }, function (e) {
        console.log(e);
    });
}

function record(callback) {
    if(isRecording){
	callback(stopRecording(),prompt());
    }else{
	startRecording();
    }
    isRecording^=true;
}
function createPiano($keyBoard) {
    var $octaveTemplate = $('<div class="octave"></div>');
    var majSteps = [0, 2, 4, 5, 7, 9, 11];
    var notCMajSteps = [1, 3, 6, 8, 10];
    var $blackKeysTemplate = $('<div class="blackKeys"></div>');
    for (var i = 0; i !== 5; i++)
        $blackKeysTemplate.append('<div style="margin-left:' + (i === 0 ? 27.5 : i === 2 ? 60 : 15) + 'px"class="key black"id=' + notCMajSteps[i] + '></div>');
    $octaveTemplate.append($blackKeysTemplate);
    for (var i = 0; i !== 7; i++)
        $octaveTemplate.append('<div class="key white"id=' + majSteps[i] + '></div>');
    for (var i = octaveCount - 1-(octaveCount>>1); i !== -(octaveCount>>1); i--){
        $octaveTemplate.clone().attr('id', (i * 12)).prependTo($keyBoard);
	$keyBoard.firstChild.childNodes[1].innerHTML='<p>'+i+'</p>';
    }
    $('.key').on('mousedown', startNote);
}
function startNote() {
    var audioBufferSourceNode = audioContext.createBufferSource();
    console.log("buffer length:" + audioBuffer.length);
    audioBufferSourceNode.buffer = audioBuffer;
    audioBufferSourceNode.loop = true;
    audioBufferSourceNode.connect(pianoGainNode);
    //        audioBufferSourceNode.connect(biquadFilterNode);
    var $this = $(this);
    audioBufferSourceNode.playbackRate.value = Math.pow(semitoneRatio, parseInt($this.attr('id')) + parseInt($this.parent().closest('[id]').attr('id')));
    console.log('playbackRate.value:',audioBufferSourceNode.playbackRate.value); // TODO we can't go above 1024 on Chromium...
    audioBufferSourceNode.start();
    $this.on('mouseup', function () {
	console.log('note off!');
        audioBufferSourceNode.stop();
        audioBufferSourceNode.disconnect();
    });
}
function set(nodeName, value) {
    console.log("set(" + nodeName + ", " + value + ");");
    switch (nodeName) {
    case 'pianoGainRange':
        pianoGainNode.gain.value = value / 10.0;
        return;
    case 'rhythmGainRange':
        rhythmGainNode.gain.value = value / 10.0;
        return;
    case 'distortionGainRange':
        makeDistortionCurve(value);
        return;
    case 'echoDelayRange':
        echoDelayNode.delayTime.value = value;
        return;
    case 'echoGainRange':
        echoGainNode.gain.value = value / 100.0;
        return;
    case 'filterFrequency':
        biquadFilterNode.frequency.value = value;
        return;
    case 'filterQ':
        biquadFilterNode.Q.value = value;
        return;
    case 'filterType':
        biquadFilterNode.type = value;
        return;
        //        case 'tremoloAmountRange':
        //            tremoloAmount = value;
        //            startTremolo1();
	//            break;
        //        case 'tremoloFrequencyRange':
        //            tremoloFrequency = value;
	//            startTremolo1();
	//            break;
    }
}
