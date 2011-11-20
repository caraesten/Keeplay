var player = function(spec){
	var x = spec.x;
	var y = spec.y;
	var w = 75;
	var h = 10;
	var that = {};
	
	that.draw = function (ctx){
		ctx.fillStyle = "rgb(200,200,200)";
		ctx.fillRect (0,0,w,h);
	}
	that.setX = function(newX){
		x = newX / 2;
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
	that.getW = function(){
		return w;
	}
	that.getH = function(){
		return h;
	}
	
	return that;

}
