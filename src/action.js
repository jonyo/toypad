let codes = {},
	names = {};

class Action {
	constructor (name, code) {
		this.name = name;
		this.code = code;
	}

	static add (name, code) {
		var action = new Action(name, code);
		codes[code] = action;
		names[name] = action;
	}
}

Action.add('ADD', 0);
Action.add('REMOVE', 1);

exports.codes = codes;
exports.names = names;
