var gameInit = function(spec){
	var that = {}, media_url = spec.media_url;
	
	function startGame(accomp)
	{
		var key = $("#keyslider").slider("value");
		var musician = false;
		if ($("#musicianmode").html() === "ON"){
			musician = true;
		}
		console.log("Musician: " + musician);
		$.modal.close();
		var sound = soundGame({'VCOs': 2, 'sampleRate': 44100, 'accomp':accomp, 'playMode':'inGame'});
		sound.play();
		var game = gameEngine({'canvas': document.getElementById('canvas'), 'audio': sound, 'media': media_url, 'key':key, 'musician': musician });
		game.init();
		$("#exportMelody").live('click', function(){
			var melody_obj = {
				'melody': sound.getNotes()
			}
			$.ajax({
				type: 'POST',
				url: "/savemelody/",
				data: $.param(melody_obj), 
				success: function(data){
					var json_data = data;
					if (json_data.status == "succeeded"){
						$("#saveMel").html("Thanks!");
					}
					else if (json_data.status == "login"){
						$("#saveMel").html("Your session has expired! Click <a class='loginPopup'>here</a> to login and <a id='exportMelody'>to save your melody</a>");
					}
				},
				dataType: 'JSON'
			});
		});
	}
	that.doInit = function(){
		$("#musicianmode").bind("click", function(){
			if ($(this).html() === "OFF"){
				$(this).html("ON");
			}
			else {
				$(this).html("OFF");
			}
		});
	
		$(".loginPopup").live("click", function(){
			newwindow = window.open('/auth/facebook/?fbwindow=yes','Login','height=500,width=650');
		});
		$("#saveScore").live("click", function(){
			$("/savescore", {'score': parseInt(document.getElementById("score").innerHTML)}, function(response){
				var resp_parse = $.parseJSON(response);
				if (resp_parse.status === 'login'){
					var alertElem = document.getElementById('loginAlert');
					alertElem.innerHTML = "Your session expired! Click <a class='loginPopup'>here</a> to login and <a id='saveScore'>here</a> to save your score.";
				}
				else if (resp_parse.status === 'succeeded'){
					alertElem.innerHTML = "Thanks!";
				}
				else {
					alert('Problem...');
				}
			});
		});
	
		$("#keyslider").slider({
			min: 0,
			max: 11,
			slide: function(event, ui){
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
				var element = document.getElementById("keydisplay");
				element.innerHTML = allNotes[ui.value];
			}
			
	
		});
		
		var currentID = null;
		var prevSound = null;
		$("#melody_pick").modal({
			opacity:80,
			overlayCss: {backgroundColor:"#000"}
		});
		$("#noMel").bind('click', function(){
			var accomp = [];
			startGame(accomp);
		});
		$(".melPlay").bind("click", function(){
			var id = $(this).parent("li").attr('id').replace('mel','');
			var accomp = $.parseJSON($("#melodyJSON" + id).val());
			console.log(accomp);
			if (prevSound){
				prevSound.pause();
				prevSound.replaceAccomp(accomp);
				prevSound.resume();
			}
			else {
				prevSound = soundGame({'VCOs': 1, 'sampleRate':44100,'accomp':accomp, 'playMode':"preview" });
				prevSound.play();
			}
			$(".melPlay").removeClass("playing");
			$(".melPlay").html("Play");
			currentID = id;
			$(this).html("Pause");
			$(this).addClass("playing");
			$(this).unbind("click");
			$(this).bind('click', function(){
				if ($(this).hasClass('playing')){
					$(this).removeClass('playing');
					prevSound.pause();
					$(this).html("Play");
				}
				else {
					if (prevSound){
						prevSound.pause();
					}
					$(".melPlay").removeClass("playing");
					$(".melPlay").html("Play");
					if (currentID != id){
						prevSound.pause();
						prevSound.replaceAccomp(accomp);
						prevSound.resume();
						currentID = id;
					}
					else {
						prevSound.resume();
					}
					$(this).addClass("playing");
					$(this).html("Pause");
				}
			});
		});
		$(".melSelect").bind("click", function(){
			var id = $(this).parent("li").attr('id').replace('mel','');
			var accomp = $.parseJSON($("#melodyJSON" + id).val());
			if (prevSound){
				prevSound.pause();
				prevSound.replaceAccomp([]);
				prevSound = null;
			}
			startGame(accomp);
		});
	}
	return that;

}