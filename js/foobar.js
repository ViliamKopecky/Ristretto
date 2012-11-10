var Foobar = function() {
};

Foobar.prototype.foo = function(times) {
	times = +times;
	times = Math.max(0, times);
	if(times === 0) {
		return "";
	}
	str = "f";
	for(var k=0;k<times;k++) {
		str += "o";
	}
	return str;
};