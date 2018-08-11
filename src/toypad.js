/**
 * @module toypad
 */

const EventEmitter = require('events');
const Device = require('./device');
const Minifig = require('./minifig');
const Panel = require('./panel');
const Action = require('./action');
const debug = require('debug')('toypad');

class Toypad extends EventEmitter {
	constructor () {
		super();
		this.device = new Device();
		this.device.on('data', this._onDeviceData.bind(this));
		this.device.on('error', function (e) {
			debug('error: %O', e);
			/**
			 * Error event, usually when there is some problem communicating with device.
			 * @event Toypad#error
			 * @type {Object}
			 */
			emit('error', e);
		});
	}

	/**
	 * Connect to the toypad, or disconnect and reconnect if already connected.
	 */
	connect () {
		this.device.connect();
	}

	/**
	 * Disconnect from the toypad.
	 */
	disconnect () {
		this.device.disconnect();
	}

	/**
	 * Change the panel color to the new color instantly.
	 * @param {module:toypad/panel~Panel} panel
	 * @param {module:toypad/color~Color} color
	 */
	panelChange (panel, color) {
		debug('panelChange: Changing %s panel to %s color', panel.name, color.name);
		this.device.sendPacket(
			[0x55, 0x06, 0xc0],
			[
				panel.code,
				(color.code >> 16) & 0xFF,
				(color.code >> 8) & 0xFF,
				color.code & 0xFF
			]
		);
	}

	/**
	 * Change multiple panels at once.
	 * @param {module:toypad/color~Color|null} centerColor Center pad color, or null to indicate no change to this pad
	 * @param {module:toypad/color~Color|null} leftColor Left pad color, or null to indicate no change to this pad
	 * @param {module:toypad/color~Color|null} rightColor right pad color, or null to indicate no change to this pad
	 */
	panelsChange(centerColor, leftColor, rightColor) {
		debug(
			'panelsChange: Center panel to %s, left panel to %s, right panel to %s',
			centerColor.name || 'NO CHANGE',
			leftColor.name || 'NO CHANGE',
			rightColor.name || 'NO CHANGE'
		);
		var addPadColor = function(color) {
			if (color === null) {
				return [0, 0, 0, 0];
			}
			return [
				1,
				(color.code >> 16) & 0xff,
				(color.code >> 8) & 0xff,
				color.code & 0xff
			];
		};
		this.device.sendPacket(
			[0x55, 0x0e, 0xc8],
			[].concat(
				addPadColor(centerColor),
				addPadColor(leftColor),
				addPadColor(rightColor)
			)
		);
	}

	/**
	 * Fade the pad color to the given color, optionally pulsing by using changeCount > 1.  When pulsing, it will go
	 * between the new color, and previous color.
	 * @param {module:toypad/panel~Panel} panel
	 * @param {module:toypad/color~Color} color
	 * @param {number} secondsPerChange Number of seconds to take when fading to the new color. Valid range is
	 * from 0 - 15.9 seconds. If use 0 seconds it will not use this color on the next pulse or flash, it is better to
	 * use panelChange instead of 0 seconds for panelFade to avoid unexpected behavior.
	 * @param {number} changeCount Number of times to change colors, valid range is 0-255.
	 * Odd number: color ends on the new color and stays on the color
	 * Even number: color ends on the previous color and stays on that color
	 * If >= 200 it will continue to fade between colors forever until next color change for the pad is sent.
	 */
	panelFade (panel, color, secondsPerChange, changeCount) {
		debug(
			'panelFade: Fading %s panel to %s, with %d seconds per change and change count of %d',
			panel.name,
			color.name,
			secondsPerChange,
			changeCount
		);
		this.device.sendPacket(
			[0x55, 0x08, 0xc2],
			[
				panel.code,
				(secondsPerChange * 16) & 0xff,
				changeCount & 0xff,
				(color.code >> 16) & 0xFF,
				(color.code >> 8) & 0xFF,
				color.code & 0xFF
			]
		);
	}

	/**
	 * Fade multiple panels each with their own color and options.  See panelFade docs for more in-depth description
	 * for each of the options.
	 * @param {object|null} centerOptions Fade settings for center panel, null to not fade
	 * @param {module:toypad/color~Color} centerOptions.color Color to fade to
	 * @param {number} centerOptions.secondsPerChange Number of seconts to take when fading to the new color.
	 * @param {number} centerOptions.changeCount Number of times to change colors
	 * @param {object|null} leftOptions Fade settings for left panel, null to not fade
	 * @param {module:toypad/color~Color} leftOptions.color Color to fade to
	 * @param {number} leftOptions.secondsPerChange Number of seconts to take when fading to the new color.
	 * @param {number} leftOptions.changeCount Number of times to change colors
	 * @param {object|null} rightOptions Fade settings for right panel, null to not fade
	 * @param {module:toypad/color~Color} rightOptions.color Color to fade to
	 * @param {number} rightOptions.secondsPerChange Number of seconts to take when fading to the new color.
	 * @param {number} rightOptions.changeCount Number of times to change colors
	 */
	panelsFade (centerOptions, leftOptions, rightOptions) {
		debug('panelsFade: fading multiple panels with options: %O', {
			centerOptions: centerOptions,
			leftOptions: leftOptions,
			rightOptions: rightOptions
		});
		var addPadOptions = function(options) {
			if (options === null) {
				return [0, 0, 0, 0, 0, 0];
			}
			return [
				1,
				(options.secondsPerChange * 16) & 0xff,
				options.changeCount & 0xff,
				(options.color.code >> 16) & 0xff,
				(options.color.code >> 8) & 0xff,
				options.color.code & 0xff
			];
		}
		this.device.sendPacket(
			[0x55, 0x14, 0xc6],
			[].concat(
				addPadOptions(centerOptions),
				addPadOptions(leftOptions),
				addPadOptions(rightOptions)
			)
		);
	}

	/**
	 * Flash the pad color from the existing color to the onColor without fading between colors.
	 * @param {object} panel
	 * @param {object} onColor This is the color to flash "too"
	 * @param {number} onSecondsPerChange Number of seconds to show the onColor each change. Valid range is 0 - 15.9
	 * @param {number} offSecondsPerChange Number of seconds to show the previous color when it is flashing the
	 * previous color. Valid range is 0 - 15.9
	 * @param {number} changeCount Number of times to change colors, valid range is 0-255.
	 * Odd number: color ends on the new color and stays on the color
	 * Even number: color ends on the previous color and stays on that color
	 * If >= 199 it will continue to flash forever until next color change for the pad is sent.
	 */
	panelFlash (panel, onColor, onSecondsPerChange, offSecondsPerChange, changeCount) {
		debug(
			'Flashing %s panel to %s for %d seconds, then off for %d seconds, with total number of %d changes',
			panel.name,
			onColor.name,
			onSecondsPerChange,
			offSecondsPerChange,
			changeCount
		);
		this.device.sendPacket(
			[0x55, 0x09, 0xc3],
			[
				panel.code,
				(onSecondsPerChange * 16) & 0xff,
				(offSecondsPerChange * 16) & 0xff,
				changeCount & 0xff,
				(onColor.code >> 16) & 0xFF,
				(onColor.code >> 8) & 0xFF,
				onColor.code & 0xFF
			]
		);
	}

	/**
	 * Flash multiple panels each with their own color and options.  See panelFlash docs for more in-depth description
	 * for each of the options.
	 * @param {object|null} centerOptions Flash settings for center panel, null to not flash
	 * @param {module:toypad/color~Color} centerOptions.onColor Color to flash to
	 * @param {number} centerOptions.onSecondsPerChange Number of seconds to show the onColor for each change.
	 * @param {number} centerOptions.offSecondsPerChange Number or seconds to show the previous color (off color)
	 * @param {number} centerOptions.changeCount Number of times to change colors
	 * @param {object|null} leftOptions Flash settings for left panel, null to not flash
	 * @param {module:toypad/color~Color} leftOptions.onColor Color to flash to
	 * @param {number} leftOptions.onSecondsPerChange Number of seconds to show the onColor for each change.
	 * @param {number} leftOptions.offSecondsPerChange Number or seconds to show the previous color (off color)
	 * @param {number} leftOptions.changeCount Number of times to change colors
	 * @param {object|null} rightOptions Flash settings for right panel, null to not flash
	 * @param {module:toypad/color~Color} rightOptions.onColor Color to flash to
	 * @param {number} rightOptions.onSecondsPerChange Number of seconds to show the onColor for each change.
	 * @param {number} rightOptions.offSecondsPerChange Number or seconds to show the previous color (off color)
	 * @param {number} rightOptions.changeCount Number of times to change colors
	 */
	panelsFlash (centerOptions, leftOptions, rightOptions) {
		debug('panelsFlash: Flashing multiple panels with options: %O', {
			centerOptions: centerOptions,
			leftOptions: leftOptions,
			rightOptions: rightOptions
		});
		var addPadOptions = function(options) {
			if (options === null) {
				return [0, 0, 0, 0, 0, 0, 0];
			}
			return [
				1,
				(options.onSecondsPerChange * 16) & 0xff,
				(options.offSecondsPerChange * 16) & 0xff,
				options.changeCount & 0xff,
				(options.onColor.code >> 16) & 0xff,
				(options.onColor.code >> 8) & 0xff,
				options.onColor.code & 0xff
			];
		}
		this.device.sendPacket(
			[0x55, 0x17, 0xc7],
			[].concat(
				addPadOptions(centerOptions),
				addPadOptions(leftOptions),
				addPadOptions(rightOptions)
			)
		);
	}

	/**
	 * Internal handler when data is emitted from device.  Handles emitting an appropriate event depending on the data.
	 * @param {object} data
	 * @private
	 */
	_onDeviceData (data) {
		debug('onDeviceData: %O', data);
		if (data.command === 'minifig-scan') {
			// minifg scanned
			debug('minifig-scan');
			var uid = Minifig.bufferToUid(data.uid);
			var out = {
				'panel': Panel.codes[data.panel] || null,
				'action': Action.codes[data.action] || null,
				'minifig': Minifig.uids[uid] || null,
				'uid': uid,
				'minifigIndex': data.minifigIndex
			}
			if (out.minifig) {
				// set tag index for reference to allow reading later
				out.minifig.index = data.minifigIndex;
				// Add or remove action from the panel
				if (out.action === Action.names.ADD) {
					out.panel.addMinifig(out.minifig);
					Panel.names.ALL.addMinifig(out.minifig);
				} else if (out.action === Action.names.REMOVE) {
					out.panel.removeMinifig(out.minifig);
					Panel.names.ALL.removeMinifig(out.minifig);
				}
			}

			/**
			 * Minifig scan event, a minifig was either added or removed from a panel.  Also gets fired on startup if
			 * any minifigs are already on the toypad.
			 * @event Toypad#minifig-scan
			 * @type {object}
			 * @property {Panel} panel Which panel the minifig was added/removed from
			 * @property {Action} action The action, action.name will either be ADD or REMOVE
			 * @property {minifig|null} minifig If the UID goes to a defined minifig, will be the minifig object, null
			 * if the UID does not match any defined minifigs
			 * @property {string} uid The UID of the minifig, passed in case the minifig is not defined
			 * @property {number} minifigIndex The index number, also part of the minifig object, see Minifig.index
			 */
			this.emit('minifig-scan', out);
		} else if (data.command === 'connected') {
			/**
			 * Connected event, happens when connection to toypad is successfully made.
			 * @event Toypad#connected
			 */
			this.emit('connected');
		}
	}
}

Toypad.Color = require('./color');
Toypad.colors = Toypad.Color.names;
Toypad.Minifig = Minifig;
Toypad.minifigs = Minifig.names;
Toypad.panels = Panel.names;
Toypad.actions = Action.names;

module.exports = Toypad;
