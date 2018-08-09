const codes = {};
const names = {};

/**
 * Class representing actions received for minifig-scan
 */
class Action {
	/**
	 * Constructor to initialize the action
	 * @param  {string} name
	 * @param  {number} code
	 * @constructor
	 */
	constructor (name, code) {
		this.name = name;
		this.code = code;
	}

	/**
	 * Add a new action to the list.
	 * @param {Action} action
	 */
	static add (action) {
		codes[code] = action;
		names[name] = action;
	}
}

Action.add(new Action('ADD', 0));
Action.add(new Action('REMOVE', 1));

exports.codes = codes;
exports.names = names;
