/**
 * @module toypad/action
 */

/**
 * Class representing actions received for minifig-scan
 */
class Action {
	/**
	 * Constructor to initialize the action
	 * @param {string} name
	 * @param {number} code
	 * @constructor
	 */
	constructor (name, code) {
		this.name = name;
		this.code = code;
	}

	/**
	 * Add a new action to the list.
	 * @param {module:toypad/action~Action} action
	 */
	static add (action) {
		Action.codes[action.code] = action;
		Action.names[action.name] = action;
	}
}

Action.codes = {};
Action.names = {};

Action.add(new Action('ADD', 0));
Action.add(new Action('REMOVE', 1));

module.exports = Action;
