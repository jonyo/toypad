const EventEmitter = require('events');
const HID = require('node-hid');
const Minifig = require ('./minifig.js');
const Action = require('./action.js');
const Panel = require('./panel.js');
const Color = require('./color.js');
const VENDOR_ID = 0x0e6f;
const PRODUCT_ID = 0x0241;
const Debug = require('debug');
const debug = Debug('toypad:device');
const debugHid = Debug('toypad:HID');
const debugHidRaw = Debug('toypad:HID-raw');
const error = Debug('app:error');

class Device extends EventEmitter {
	constructor () {
		super();
		this.hid = null;
		// Used for each command, it is sent with every command sent to the gamepad and is incremented for every one
		this._commandIndex = 0;
	}

	get panels () {
		return Panel.names;
	}

	get colors () {
		return Color.names;
	}

	get minifigs () {
		return Minifig.names;
	}

	get actions () {
		return Action.names;
	}

	/**
	 * Connect to the toypad
	 */
	connect () {
		debug('Connecting to toypad...');
		if (this.hid) {
			debug('Connection was already established, closing existing connection and re-connecting...');
			this.disconnect();
		}
		this.hid = new HID.HID(VENDOR_ID, PRODUCT_ID);

		this.hid.on('data', this._onHidData.bind(this));
		this.hid.on('error', this._onHidError.bind(this));

		// Initialize handshake
		this.hid.write([
			0x00, 0x55, 0x0f, 0xb0, 0x01, 0x28, 0x63, 0x29, 0x20, 0x4c, 0x45, 0x47, 0x4f, 0x20, 0x32, 0x30, 0x31,
			0x34, 0xf7, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]);
	}

	/**
	 * Disconnect from the toypad
	 */
	disconnect () {
		debug('Disconnecting from toypad...');
		if (!this.hid) {
			debug('No connection to close...');
			return;
		}
		this.hid.close();
		this.hid = null;
	}

	/**
	 * Change the panel color to the new color instantly.
	 * @param {object} panel
	 * @param {object} color
	 */
	panelChange (panel, color) {
		debug('panelChange: Changing %s panel to %s color', panel.name, color.name);
		var data = [
			this._commandIndex & 0xFF,
			panel.code,
			(color.code >> 16) & 0xFF,
			(color.code >> 8) & 0xFF,
			color.code & 0xFF
		];
		this._write([0x55, 0x06, 0xc0].concat(data));
		this._commandIndex++;
	}

	/**
	 * Change multiple panels at once.
	 * @param {object|null} centerColor Center pad color, or null to indicate no change to this pad
	 * @param {object|null} leftColor Left pad color, or null to indicate no change to this pad
	 * @param {object|null} rightColor right pad color, or null to indicate no change to this pad
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
		var data = [this._commandIndex & 0xff]
			.concat(addPadColor(centerColor))
			.concat(addPadColor(leftColor))
			.concat(addPadColor(rightColor));
		this._write([0x55, 0x0e, 0xc8].concat(data));
		this._commandIndex++;
	}

	/**
	 * Fade the pad color to the given color, optionally pulsing by using changeCount > 1.  When pulsing, it will go
	 * between the new color, and previous color.
	 * @param {object} panel
	 * @param {object} color
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
		var data = [
			this._commandIndex & 0xFF,
			panel.code,
			(secondsPerChange * 16) & 0xff,
			changeCount & 0xff,
			(color.code >> 16) & 0xFF,
			(color.code >> 8) & 0xFF,
			color.code & 0xFF
		];
		this._write([0x55, 0x08, 0xc2].concat(data));
		this._commandIndex++;
	}

	/**
	 * Fade multiple panels each with their own color and options.  See panelFade docs for more in-depth description
	 * for each of the options.
	 * @param {object|null} centerOptions Fade settings for center panel, null to not fade
	 * @param {object} centerOptions.color Color to fade to
	 * @param {number} centerOptions.secondsPerChange Number of seconts to take when fading to the new color.
	 * @param {number} centerOptions.changeCount Number of times to change colors
	 * @param {object|null} leftOptions Fade settings for left panel, null to not fade
	 * @param {object} leftOptions.color Color to fade to
	 * @param {number} leftOptions.secondsPerChange Number of seconts to take when fading to the new color.
	 * @param {number} leftOptions.changeCount Number of times to change colors
	 * @param {object|null} rightOptions Fade settings for right panel, null to not fade
	 * @param {object} rightOptions.color Color to fade to
	 * @param {number} rightOptions.secondsPerChange Number of seconts to take when fading to the new color.
	 * @param {number} rightOptions.changeCount Number of times to change colors
	 */
	panelsFade (centerOptions, leftOptions, rightOptions) {
		debug('panelsFade: fading multiple panels');
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
		var data = [this._commandIndex & 0xff]
			.concat(addPadOptions(centerOptions))
			.concat(addPadOptions(leftOptions))
			.concat(addPadOptions(rightOptions));
		this._write([0x55, 0x14, 0xc6].concat(data));
		this._commandIndex++;
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
		var data = [
			this._commandIndex & 0xFF,
			panel.code,
			(onSecondsPerChange * 16) & 0xff,
			(offSecondsPerChange * 16) & 0xff,
			changeCount & 0xff,
			(onColor.code >> 16) & 0xFF,
			(onColor.code >> 8) & 0xFF,
			onColor.code & 0xFF
		];
		this._write([0x55, 0x09, 0xc3].concat(data));
		this._commandIndex++;
	}

	/**
	 * Flash multiple panels each with their own color and options.  See panelFlash docs for more in-depth description
	 * for each of the options.
	 * @param {object|null} centerOptions Flash settings for center panel, null to not flash
	 * @param {object} centerOptions.onColor Color to flash to
	 * @param {number} centerOptions.onSecondsPerChange Number of seconds to show the onColor for each change.
	 * @param {number} centerOptions.offSecondsPerChange Number or seconds to show the previous color (off color)
	 * @param {number} centerOptions.changeCount Number of times to change colors
	 * @param {object|null} leftOptions Flash settings for left panel, null to not flash
	 * @param {object} leftOptions.onColor Color to flash to
	 * @param {number} leftOptions.onSecondsPerChange Number of seconds to show the onColor for each change.
	 * @param {number} leftOptions.offSecondsPerChange Number or seconds to show the previous color (off color)
	 * @param {number} leftOptions.changeCount Number of times to change colors
	 * @param {object|null} rightOptions Flash settings for right panel, null to not flash
	 * @param {object} rightOptions.onColor Color to flash to
	 * @param {number} rightOptions.onSecondsPerChange Number of seconds to show the onColor for each change.
	 * @param {number} rightOptions.offSecondsPerChange Number or seconds to show the previous color (off color)
	 * @param {number} rightOptions.changeCount Number of times to change colors
	 */
	panelsFlash (centerOptions, leftOptions, rightOptions) {
		debug('panelsFlash: Flashing multiple panels');
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
		var data = [this._commandIndex & 0xff]
			.concat(addPadOptions(centerOptions))
			.concat(addPadOptions(leftOptions))
			.concat(addPadOptions(rightOptions));
		this._write([0x55, 0x17, 0xc7].concat(data));
		this._commandIndex++;
	}

	/**
	 * Request to read memory from the tag.  This is async request so will need to request then listen for the response.
	 * This is still a work in progress so the signature will probably change when we get it fully working.
	 * @param {number} tagIndex Tag index
	 * @param {[type]} pageNum  [description]
	 * @private
	 */
	_readTag(tagIndex, pageNum) {
		debug('readTag: Sending command to read the %d page for tag with index %d', pageNum, tagIndex);
		debug('Note: This is still experimental, responses are not yet emitted (still figuring out how to parse)');
		debug(
			'Index used for request: %d (will need this when getting results. Probably. It is experimental, remember?)',
			this._commandIndex
		);
		this._write([0x55, 0x04, 0xd2, this._commandIndex & 0xff, tagIndex & 0xff, pageNum & 0xff]);
		this._commandIndex++;
		// todo: return command index as it appears to be needed to tell what results go to what request...
		// Maybe this should be done for all commands?
	}

	/**
	 * Internal handler when data is emitted from HID.  Handles emitting an appropriate event depending on the data.
	 * @param {string} data
	 * @private
	 */
	_onHidData (data) {
		debugHidRaw('read: %o', data);
		var cmd = data[1];

		if (cmd === 0x0b) {
			// minifg scanned
			debugHid('minifig-scan');
			var uid = Minifig.Minifig.bufferToUid(data.slice(7, 13));
			if (Minifig.uids[uid]) {
				// set tag index for reference to allow reading later
				Minifig.uids[uid].tagIndex = data[4];
			}
			this.emit(
				'minifig-scan',
				{
					'panel': Panel.codes[data[2]] || null,
					'action': Action.codes[data[5]] || null,
					'minifig': Minifig.uids[uid] || null,
					'uid': uid,
					'tagIndex': data[4]
				}
			);
		} else if (cmd === 0x01) {
			// LED change
			debugHid('led-change');
		} else if (cmd === 0x02) {
			debugHid('tag-read - possibly the tagIndex not found or no longer on toypad?');
			debugHid('for command index: %d', data[2]);
		} else if (cmd === 0x12) {
			debugHid('tag-read');
			debugHid('for command index: %d', data[2]);
		} else if (cmd === 0x19) {
			// connected
			debugHid('connected');
			this.emit('connected');
		} else {
			debugHid('Unknown toypad command: %s', cmd);
		}
	}

	/**
	 * Handler used internally when error is emitted by HID
	 * @param {object} error
	 * @private
	 */
	_onHidError (error) {
		debugHid('error: %O', error);
		this.emit('error', error);
	}

	/**
	 * Internal method to write data to the HID device, adding padding and checksum automatically.
	 * @param {string} data Data to write
	 * @private
	 */
	_write (data) {
		if (!this.hid) {
			error('Cannot send, not connected to toypad.');
			return;
		}
		debugHidRaw('write: %o', data);
		this.hid.write(
			[0x00].concat(
				this._pad(
					this._checksum(data)
				)
			)
		);
	}

	/**
	 * Used internally to add checksum to the data.
	 * @param {string} data
	 * @return {string} Data with checksum added
	 * @private
	 */
	_checksum (data) {
		var checksum = 0;
		for (var i = 0; i < data.length; i++) {
			checksum += data[i];
		}
		data.push(checksum & 0xFF);
		return data;
	}

	/**
	 * Used internally to pad the data with 0 up to 32 bytes
	 * @param {string} data
	 * @return {string} Data with padding added
	 * @private
	 */
	_pad (data) {
		while(data.length < 32) {
			data.push(0x00);
		}
		return data;
	}
}

module.exports = Device;
