var codes = {},
	names = {},
	color = require('./color.js');

var panel = function (name, code){
	this.code = code;
	this.name = name;
	this.minifigs = {};
	this.color = color.OFF;
};

panel.prototype.addMinifig = function(minifig) {
	this.minifigs[minifig.name] = minifig;
};

panel.prototype.removeMinifig = function(minifig) {
	delete this.minifigs[minifig.name];
};

var add = function(name, code) {
	if (name === 'byCode') {
		return;
	}
	var info = new panel(name, code);
	codes[code] = info;
	names[name] = info;
};

add('ALL', 0);
add('CENTER', 1);
add('LEFT', 2);
add('RIGHT', 3);

exports.codes = codes;
exports.names = names;
