var fs = require('fs');

var deleteFolderRecursive = function(path) {
	if(fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.statSync(curPath).isDirectory()) {
				deleteFolderRecursive(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

var rm = [__dirname + "/php/log", __dirname + "/php/temp"];

rm.forEach(function(path){
	deleteFolderRecursive(path);
	console.log('removed:', path);
});