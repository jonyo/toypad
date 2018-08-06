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

	disconnect () {
		if (!this.hid) {
			return;
		}
		this.hid.close();
		this.hid = null;
	}

	/**
	 * Fade the pad color to the given color, taking the amount of seconds specified.
	 *
	 * @param  {object} panel
	 * @param  {object} color
	 * @param  {number} seconds Number of seconds to take when fading to the new color, from 0-16 seconds
	 */
	fadePanel (panel, color, seconds) {
		var speed = seconds * 16;
		var data = [
			this.colorUpdateNumber & 0xFF,
			panel.code,
			speed & 0xff,
			0x01,
			(color.code >> 16) & 0xFF,
			(color.code >> 8) & 0xFF,
			color.code & 0xFF
		];
		this._write([0x55, 0x08, 0xc2].concat(data));
		this.colorUpdateNumber++;
	}

	changePanel (panel, color) {
		// todo...
	}

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

	_onHidError (error) {
		this.emit('error', error);
	}

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

	_checksum (data) {
		var checksum = 0;
		for (var i = 0; i < data.length; i++) {
			checksum += data[i];
		}
		data.push(checksum & 0xFF);
		return data;
	}

	_pad (data) {
		while(data.length < 32) {
			data.push(0x00);
		}
		return data;
	}
}

module.exports = Device;
