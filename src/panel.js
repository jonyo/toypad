let codes = {},
	names = {};
// todo...
var color = require('./color.js');

class Panel {
	constructor (name, code) {
		this.name = name;
		this.code = code;
		this.minifigs = {};
		this.color = color.OFF;
	}

	addMinifig (minifig) {
		this.minifigs[minifig.name] = minifig;
	}

	removeMinifig (minifig) {
		delete this.minifigs[minifig.name];
	}

	static add (name, code) {
		var panel = new Panel(name, code);
		codes[code] = panel;
		names[name] = panel;
	}
}

// initialize panels
Panel.add('ALL', 0);
Panel.add('CENTER', 1);
Panel.add('LEFT', 2);
Panel.add('RIGHT', 3);

exports.codes = codes;
exports.names = names;
