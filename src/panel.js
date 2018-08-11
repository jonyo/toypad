/**
 * @module toypad/panel
 */

const codes = {};
const names = {};
const Color = require('./color.js');

/**
 * Panel class
 * @property {string} name Name of the panel
 * @property {number} code Code that the panel is identified with on the toypad
 * @property {Color} color The current color of the panel
 * @property {object.<string, Minifig>} minifigs List of minifigs (by name) currently on this panel
 */
class Panel {
	/**
	 * Initialize the panel
	 * @param  {string} name Panel name, like CENTER
	 * @param  {number} code How it is identified by the toypad
	 */
	constructor (name, code) {
		this.name = name;
		this.code = code;
		this.minifigs = {};
		// TODO: keep track of the color?
		this.color = Color.OFF;
	}

	/**
	 * Add the minifig to this panel. This helps to keep track of what panel has what minifigs.
	 * @param {Minifig} minifig The minifig to add
	 */
	addMinifig (minifig) {
		this.minifigs[minifig.name] = minifig;
	}

	/**
	 * Remove the minifig from this panel.
	 * @param {Minifig} minifig The minifig to remove
	 */
	removeMinifig (minifig) {
		delete this.minifigs[minifig.name];
	}

	/**
	 * Get the current number of minifigs on this panel
	 * @return {number}
	 */
	minifigCount() {
		return Object.keys(this.minifigs).length;
	}

	/**
	 * Add the panel to the list of panels
	 * @param {Panel} panel
	 */
	static add (panel) {
		codes[panel.code] = panel;
		names[panel.name] = panel;
	}
}

// initialize panels
Panel.add(new Panel('ALL', 0));
Panel.add(new Panel('CENTER', 1));
Panel.add(new Panel('LEFT', 2));
Panel.add(new Panel('RIGHT', 3));

exports.codes = codes;
exports.names = names;
