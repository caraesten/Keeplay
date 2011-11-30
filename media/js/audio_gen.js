
// soundGame must be initialized with an object containing at least:
// 		- VCOs
//		- sampleRate
//		- playMode


var soundGame = function(spec){
	that = {};
	
	var freq = 440;
	var VCOs = [];
	var VCOs2 = [];
	var dev;
	var noteBuf = [];
	var noteBuf2 = spec.accomp;
	var noteCount = 0;
	var noteCount2 = 0;
	var leadNoteLength = 0;
	var leadNoteLength2 = 0;
	var tempo = 120;
	var notesPerBeat = 4;
	var paused = false;
	var playMode = spec.playMode;
	console.log(playMode);
	//var adsr = audioLib.ADSREnvelope(spec.sampleRate, 10, 500, 0.2, 1500);
	var dly = audioLib.Delay(spec.sampleRate, 500, 0.4);
	var flt = audioLib.LP12Filter(spec.sampleRate, 8000, 8);
	var fxchain = new audioLib.EffectChain(dly,flt);

	
	for (var i = 0; i < spec.VCOs; i++){
		VCOs.push( new audioLib.Oscillator(spec.sampleRate, 0));
		VCOs[i].waveShape = 'square';
		VCOs2.push( new audioLib.Oscillator(spec.sampleRate, 0));
		VCOs2[i].waveShape = 'square';
	}
	
	
	function loadNote(buf){
			if (buf==="lead"){
				var note = noteBuf[noteCount];
				var detune = 0;
				for (var n = 0; n < VCOs.length; n++){
					if (typeof note != 'undefined'){
						VCOs[n].reset();
						VCOs[n].frequency = note.freq + detune;
						detune += 5;
						leadNoteLength = Math.floor(note.dur * spec.sampleRate * 60 * notesPerBeat / tempo);
					}				
				}
				if (noteCount < noteBuf.length){
					if (leadNoteLength != 0){
						noteCount += 1;
					}
				}
				else {
					for (var n = 0; n < VCOs.length; n++){
						VCOs[n].reset();
						VCOs[n].frequency = 0;
					}
				}
				if (playMode === 'inGame'){
					var note2 = noteBuf2[noteCount2];
					for (var n = 0; n < VCOs2.length; n++){
						if (typeof note2 != 'undefined'){
							VCOs2[n].reset();
							VCOs2[n].frequency = note2.freq;
							leadNoteLength2 = Math.floor(note2.dur * spec.sampleRate * 60 * notesPerBeat / tempo);
						}
					}
					if (noteCount2 < noteBuf2.length){
						if (leadNoteLength2 != 0){
							noteCount2 += 1;
						}
					}
					else {
						noteCount2 = 0;
					}
				}
			}
			else if (buf==="accomp") {
				var note = noteBuf2[noteCount2];
				for (var n = 0; n < VCOs2.length; n++){
					if (typeof note != 'undefined'){
						VCOs2[n].reset();
						VCOs2[n].frequency = note.freq;
						leadNoteLength2 = Math.floor(note.dur * spec.sampleRate * 60 * notesPerBeat / tempo);
					}
				}
				if (noteCount2 < noteBuf2.length){
					if (leadNoteLength2 != 0){
						noteCount2 += 1;
					}
				}
				else {
					noteCount2 = 0;
				}

			}
	}
	
	that.play = function() {
		dev = new audioLib.AudioDevice( function(buffer, channelCount){
			var sample, cur;
			var l = buffer.length;
			if (paused == false){
				for (var current = 0; current < l; current += channelCount){
					if (leadNoteLength === 0){
						if (noteBuf.length > noteCount){
							loadNote("lead");
						}
						else {
							for (var n = 0; n < VCOs.length; n++){
								VCOs[n].reset();
								VCOs[n].frequency = 0;
							}
							if (playMode === 'inGame'){
								for (var n = 0; n < VCOs2.length; n++){
									VCOs2[n].reset();
									VCOs2[n].frequency = 0;
								}
							}
						}
						//adsr.triggerGate(true);
					}
					if (playMode === 'preview'){
						if (leadNoteLength2 === 0){
							// accompaniment is looped
							loadNote("accomp");
						}
					}
					
					sample = 0;
					for (var n = 0; n < VCOs.length; n++){
							VCOs[n].generate();
							VCOs2[n].generate();
							sample += VCOs[n].getMix()*0.2;
							sample += VCOs2[n].getMix()*0.2;
							
							for (var n = 0; n < channelCount; n++){
								buffer[current + n] = fxchain.pushSample(sample);
							}
					}
					if (leadNoteLength > 0){
						leadNoteLength -= 1;
					}
					if (leadNoteLength2 > 0){
						leadNoteLength2 -= 1;
					}
					else {
					}
				}
			//adsr.append(buffer);
			}
		}, 2);
	}
		
	that.update = function() {
		dev.enabled = false;
	}
	that.pause = function(){
		paused = true;
	}
	that.resume = function(){
		paused = false;
	}
	
	that.getMatch = function(){
			if ((typeof noteBuf[noteCount - 1] != 'undefined' || noteCount == 0) && VCOs[0].frequency != 0 && Math.floor(VCOs[0].frequency) === Math.floor(VCOs2[0].frequency)){
				console.log('match');
				return true;
			}
			else {
				return false;
			}
	}

	that.getSpeed = function(){
		return spec.speed;
	}
	that.getNextFreq = function(){
		if (typeof noteBuf2 != 'undefined' && noteBuf2.length != 0){
			return noteBuf2[noteCount2].freq;
		}
		else {
			return 0;
		}
	}
	
	that.addFreq = function(nfreq){
		noteBuf.push(nfreq);
	}
	that.getTempo = function(){
		return tempo;
	}
	that.getNotes = function(){
		return noteBuf;
	}
	that.clearSink = function(){
		dev = null;
	}
	that.replaceAccomp = function(newBuff){
		noteBuf2 = newBuff;
		noteCount2 = 0;
		leadNoteLength2 = 0;
	}
	
	return that;
}
