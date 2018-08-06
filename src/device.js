const EventEmitter = require('events');
const HID = require('node-hid');
const Minifig = require ('./minifig.js');
const Action = require('./action.js');
const Panel = require('./panel.js');
const Color = require('./color.js');
const VENDOR_ID = 0x0e6f;
const PRODUCT_ID = 0x0241;

class Device extends EventEmitter {
	constructor () {
		super();
		this.hid = null;
		this.colorUpdateNumber = 0;
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
		if (this.hid) {
			// already connected... disconnect and re-connect ??
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
		if (!this.hid) {
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
		var data = [
			this.colorUpdateNumber & 0xFF,
			panel.code,
			(color.code >> 16) & 0xFF,
			(color.code >> 8) & 0xFF,
			color.code & 0xFF
		];
		this._write([0x55, 0x06, 0xc0].concat(data));
		this.colorUpdateNumber++;
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
		var data = [
			this.colorUpdateNumber & 0xFF,
			panel.code,
			(secondsPerChange * 16) & 0xff,
			changeCount & 0xff,
			(color.code >> 16) & 0xFF,
			(color.code >> 8) & 0xFF,
			color.code & 0xFF
		];
		this._write([0x55, 0x08, 0xc2].concat(data));
		this.colorUpdateNumber++;
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
		var data = [
			this.colorUpdateNumber & 0xFF,
			panel.code,
			(onSecondsPerChange * 16) & 0xff,
			(offSecondsPerChange * 16) & 0xff,
			changeCount & 0xff,
			(onColor.code >> 16) & 0xFF,
			(onColor.code >> 8) & 0xFF,
			onColor.code & 0xFF
		];
		this._write([0x55, 0x09, 0xc3].concat(data));
		this.colorUpdateNumber++;
	}

	/**
	 * Internal handler when data is emitted from HID.  Handles emitting an appropriate event depending on the data.
	 * @param {string} data
	 * @private
	 */
	_onHidData (data) {
		console.log('got data');
		var cmd = data[1];

		if (cmd === 0x0b) {
			// minifg scanned
			console.log('minifig-scan');
			console.log(this);
			console.log(this.listenerCount('minifig-scan'));
			var uid = Minifig.Minifig.bufferToUid(data.slice(7, 13));
			this.emit(
				'minifig-scan',
				{
					'panel': Panel.codes[data[2]] || null,
					'action': Action.codes[data[5]] || null,
					'minifig': Minifig.uids[uid] || null,
					'uid': uid
				}
			);
		} else if (cmd === 0x01) {
			// LED change
			console.log('led-change', data);
		} else if (cmd === 0x19) {
			// connected
			this.emit('connected');
		} else {
			console.log('unknown toypad command', data);
		}
	}

	/**
	 * Handler used internally when error is emitted by HID
	 * @param {object} error
	 * @private
	 */
	_onHidError (error) {
		this.emit('error', error);
	}

	/**
	 * Internal method to write data to the HID device, adding padding and checksum automatically.
	 * @param {string} data Data to write
	 * @private
	 */
	_write (data) {
		if (!this.hid) {
			console.log('Cannot write, not connected to toypad.');
			return;
		}
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
