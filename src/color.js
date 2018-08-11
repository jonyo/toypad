/**
 * @module toypad/color
 */

class Color {
	/**
	 * Initialize a color
	 * @param {string} name
	 * @param {number} code HEX code in format 0xRRGGBB so all red would be 0xff0000
	 * @constructor
	 */
	constructor (name, code) {
		this.name = name;
		this.code = code;
	}

	/**
	 * Add a color to the list of colors that can be referenced by name
	 * @param {Color} color
	 * @example
	 * // Add NAVY
	 * Color.add(new Color('NAVY', 0x0000aa));
	 */
	static add (color) {
		Color.names[color.name] = color;
	}
}

Color.names = {};

// Add the main colors
Color.add(new Color('RED', 0xff0000));
Color.add(new Color('GREEN', 0x00ff00));
Color.add(new Color('BLUE', 0x0000ff));
Color.add(new Color('WHITE', 0xffffff));
Color.add(new Color('OFF', 0x000000));

module.exports = Color;
