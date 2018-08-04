var codes = {},
	names = {};

var action = function (name, code){
	this.code = code;
	this.name = name;
};

var add = function(name, code) {
	var info = new action(name, code);
	codes[code] = info;
	names[name] = info;
};

add('ADD', 0);
add('REMOVE', 1);

exports.codes = codes;
exports.names = names;
