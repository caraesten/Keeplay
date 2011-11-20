var block = function(spec){
	var freq = spec.freq;
	var points = spec.points;
	var speed = spec.speed;
	var note = spec.note;
	var inKey = spec.inKey;
	var media = spec.media;
	var x = spec.x;
	var y = 0;
	var w = spec.w;
	var h = spec.h;
	var that = {};
	
	that.draw = function (ctx){
		var img = null;
		if (inKey == true){
			img = document.getElementById("block");
		}
		else {
			img = document.getElementById("badblock");
		}
		ctx.drawImage (img,0,0);
		ctx.font = "16px ArcadeInterlacedRegular";
		ctx.fillText(note, (w/2)-9, -5);
	}
	that.update = function (){
		y += speed;
	}
	that.setX = function(newX){
		x = newX;
	}
	that.setY = function(newY){
		y = newY;
	}
	that.getX = function(){
		return x;
	}
	that.getY = function(){
		return y;
	}
	that.getFreq = function(){
		return freq;
	}
	that.getW = function(){
		return w;
	}
	that.getH = function(){
		return h;
	}
	that.isInKey = function(){
		return inKey;
	}
	
	return that;

}