/*
	Spec must include:
		canvas (the canvas element)
		media (the media url)
		audio (the audio object)
		musician (boolean for musician mode)
		key (the root note, 0 as C)
		

*/

var gameEngine = function(spec){

	var		that = {}, canv = spec.canvas, media = spec.media,
			audio = spec.audio,fps = 60, fpb = 0, misses = 0, musician = spec.musician,
			interval = null, blocks = [], cur_frame=0, root = spec.key - 9,
			mouse_x = 0, mouse_y = 0, u_player = player({'x':150, 'y': canv.height - 30});
	
	/*
		Game loop help courtesy of: 
		http://nokarma.org/2011/02/02/javascript-game-development-the-game-loop/index.html 
		
	*/

	var allNotes = 	[
						"C",
						"C#/Db",
						"D",
						"D#/Eb",
						"E",
						"F",
						"F#/Gb",
						"G",
						"G#/Ab",
						"A",
						"A#/Bb",
						"B"
					]; 
	var x = root;
	var key = [];
	var outKey = [];
	var step = 0;
	while (x <= (root + 11)){
		var _pitch = 440.0*(Math.pow(2.0,(x/12.0)));
		var baseNote = x + 9;
		var item = {
			'freq': _pitch,
			'name': allNotes[(x+9) % 12]
		}
		key.push(item);
		if (step == 4 || step == 11){
			x += 1;
			step += 1;
		}
		else {
			var _out_pitch = 440.0*(Math.pow(2.0,((x+1)/12.0)));
			var out_item = {
				'freq': _out_pitch,
				'name': allNotes[((x+1) + 9) % 12]
			};
			outKey.push(out_item);
			x += 2;
			step += 2;
		}            
	}

	function updateXY(e){

		mouse_x = e.pageX - canv.width;
		mouse_y = e.pageY;
	
	}
	
	that.init = function(){
		fpb = ((fps * 60) / audio.getTempo());
		$(window).mousemove(updateXY);
		canv.style.width = canv.width + "px";
		canv.style.height = canv.height + "px";
		interval = setInterval(run, 0);
	}
	
	var run = (function (){
		var loops = 0, skipTicks = 1000 / fps,
		maxFrameSkip = 10,
		nextGameTick = (new Date).getTime();
		return function() {
			loops = 0;
			while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip){
				updateGame();
				nextGameTick += skipTicks;
				loops++;
			}
			
			redrawBoard();
		};
	})();
	
	function updateGame(){
		// Collision detection routine referenced this:
		// http://www.gamedev.net/page/resources/_/technical/game-programming/collision-detection-r735
		var userpos;
		userpos = (mouse_x - 60) *1.5;
		u_player.setX(userpos);
		if (cur_frame >= (fpb / 2)){
			var keyPos = Math.floor(Math.random() * key.length);
			var outKeyPos = Math.floor(Math.random() * outKey.length);
			if (Math.floor(Math.random() * 5) == 1){
				blocks.push(block({'freq': outKey[outKeyPos].freq, 'note':outKey[outKeyPos].name, 'speed': 1, 'x': Math.floor(Math.random() * (401 - 50)), 'w': 50, 'h': 5, 'inKey': false,'media':media, 'musician': musician}));
			}
			else {
				blocks.push(block({'freq': key[keyPos].freq, 'note':key[keyPos].name, 'speed': 1, 'x': Math.floor(Math.random() * (401 - 50)), 'w': 50, 'h': 5, 'inKey': true, 'media':media, 'musician': musician}));
			}
			cur_frame = 0;
		}
		cur_frame++;
		
		if (misses >= 3){
			endGame();
		}
		for (var x in blocks){
			var isCollided = true;
			var top1 = blocks[x].getY();
			var top2 = u_player.getY();
			var left1 = blocks[x].getX();
			var left2 = u_player.getX();
			var bottom1 = blocks[x].getY() + blocks[x].getH();
			var bottom2 = u_player.getY() + u_player.getH();
			var right1 = blocks[x].getX() + blocks[x].getW();
			var right2 = u_player.getX() + u_player.getW();
			if (bottom1 < top2){
				isCollided = false;
			}
			if (top1 > bottom2){
				isCollided = false;
			}
			if (right1 < left2){
				isCollided = false;
			}
			if (left1 > right2){
				isCollided = false;
			}
			if (isCollided == true){
				audio.addFreq({'freq':blocks[x].getFreq(), 'dur': (1/8)});
				if (blocks[x].isInKey() == false){
					misses += 1;
					missIcon = document.createElement("img");
					missIcon.src = media + "img/miss.png";
					counter = document.getElementById("missCounter");
					counter.appendChild(missIcon);
				}
				else {
					var scoreEl = document.getElementById("score");
					var score = parseInt(scoreEl.innerHTML);
					var bonus = 1;
					if (musician === true){
						bonus = 5;
					}
					score += 200 * bonus;
					scoreEl.innerHTML = score;
				}

				blocks.splice(x, 1);
			}
			else{
				blocks[x].update(parseInt(document.getElementById("score").innerHTML));
				if (blocks[x].getY() >= canv.height){
					blocks.splice(x, 1);
				}
			}
		}
		
		// Check for matches in the key. 1 = root, 5 = fifth
		if (audio.getMatch("root", key)){
			var indicator = document.getElementById('matchIndicator');
			indicator.innerHTML = "Matched!";
			var scoreEl = document.getElementById("score");
			var score = parseInt(scoreEl.innerHTML);
			score += 200;
			scoreEl.innerHTML = score;
		}
		else if (audio.getMatch("fifth", key)){
			var indicator = document.getElementById('matchIndicator');
			indicator.innerHTML = "Fifth!";
			var scoreEl = document.getElementById("score");
			var score = parseInt(scoreEl.innerHTML);
			score += 500;
			scoreEl.innerHTML = score;
		}
		else {
			var indicator = document.getElementById('matchIndicator');
			indicator.innerHTML = "";
		}
		if (audio.getNextFreq()){
			var next = document.getElementById('nextNote');
			next.innerHTML = "Next: X";
		}
		for (var k in key){
			if (Math.floor(key[k].freq) == Math.floor(audio.getNextFreq())){
				next.innerHTML = "Next: " + key[k].name;
			}
		}
	}
	
	function redrawBoard(){
		ctx = canv.getContext('2d');
		ctx.save();
		ctx.setTransform(1,0,0,1,0,0);
		ctx.clearRect(0,0,canv.width, canv.height);
		ctx.restore();
		// Clear for redraw.
		for (var x in blocks){
			ctx.save();
			ctx.translate(blocks[x].getX(), blocks[x].getY());
			blocks[x].draw(ctx);
			ctx.restore();
		}
		ctx.save();
		ctx.translate(u_player.getX(), u_player.getY());
		u_player.draw(ctx);
		ctx.restore();
	}
	
	function ajaxScoreSave(response){
		var resp_parse = response;
		if (resp_parse.status === 'login'){
			var alertElem = document.getElementById('loginAlert');
			alertElem.innerHTML = "Your session expired! Click <a class='loginPopup'>here</a> to login and <a id='saveScore'>here</a> to save your score.";
		}
		else if (resp_parse.status === 'succeeded'){
			var alertElem = document.getElementById('loginAlert');
			alertElem.innerHTML = "";
			$.ajax({
				type: 'POST',
				url:'/data/scorelookup/',
				success: function(data){
					var resp_parse = data;
					
					if (resp_parse.status === 'login'){
						var alertElem = document.getElementById('loginAlert');
						alertElem.innerHTML = "Your session expired! But, your score has been saved. Play again to see your high scores.";
					
					}
					else if (resp_parse.status === 'succeeded'){
						var highScoreElem = document.getElementById('highScores');
						var listString = "<ul>";
						for (var x in resp_parse.data){
							listString += "<li>"+resp_parse.data[x].score + " on " + resp_parse.data[x].time + "</li>";
						}
						listString += "</ul>";
						highScoreElem.innerHTML = "Your best tries: " + listString;
					}
				},
				dataType: 'JSON'
			});
		}
		else {
			// Error condition. This is not serious, so pass.
		}
	}
	
	
	function endGame(){
		clearInterval(interval);
		blocks = [];
		audio.replaceAccomp([]);
		audio.pause();
		ctx = canv.getContext('2d');
		ctx.clearRect(0,0,canv.width, canv.height);
		$("#gameOver").modal({
			opacity:80,
			overlayCss: {backgroundColor:"#000"}
		});
		document.body.style.cursor = 'default';
		document.getElementById("finalScore").innerHTML = "Score: " + document.getElementById("score").innerHTML;
		
		// Just in case user needs to manually save score
		// due to session invalidation.
		$("#saveScore").live("click", function(){
			$.ajax({
				type: 'POST',
				url: "/savescore", 
				data: {'score': parseInt(document.getElementById("score").innerHTML)},
				success: ajaxScoreSave,
				dataType: 'JSON'
			});
		});
		$.ajax({
			type: 'POST',
			url: "/savescore", 
			data: {'score': parseInt(document.getElementById("score").innerHTML)},
			success: ajaxScoreSave,
			dataType: 'JSON'
		});
	}
	function exportNotes(){
		return audio.getNotes();
	}
	that.getNotes = function(){
		return allNotes;
	}
	return that;

}
