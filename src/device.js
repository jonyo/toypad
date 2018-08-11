/**
 * @module  toypad/device
 */

const EventEmitter = require('events');
const HID = require('node-hid');
const VENDOR_ID = 0x0e6f;
const PRODUCT_ID = 0x0241;
const Debug = require('debug');
const debug = Debug('toypad:device');
const debugHid = Debug('toypad:HID');
const debugHidRaw = Debug('toypad:HID-raw');
const error = Debug('app:error');

/**
 * Code to command name map
 * @type {Object}
 */
const commands = {
	0x01: 'led-change',
	0x02: 'tag-not-found',
	0x0b: 'minifig-scan',
	0x12: 'tag-read',
	0x19: 'connected'
};

/**
 * This does the main talking to the toypad, handling "most" of the low-level functionality involved.
 */
class Device extends EventEmitter {
	constructor () {
		super();
		this.hid = null;
		this._index = 0;
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
	 * Send data packet to the toypad.
	 * @param {Buffer} command 3 byte prefix like [0x55, 0x06, 0xc0]
	 * @param {Buffer} data Binary data to send
	 * @return {number} the command index used for sending the packet
	 */
	sendPacket(command, data) {
		var index = this._commandIndex();
		this._write(command.concat(index, data));
		return index;
	}

	/**
	 * Get the next index value to use for the next command to send.
	 * @return {number}
	 */
	_commandIndex() {
		var index = this._index & 0xff;
		this._index++;
		return index;
	}

	/**
	 * Request to read memory from the tag.  This is async request so will need to request then listen for the response.
	 * This is still a work in progress so the signature will probably change when we get it fully working.
	 * @param {number} tagIndex Tag index
	 * @param {number} pageNum
	 * @todo Finish up this method including emitting a parsed response, move it to the main toypad class
	 * @private
	 */
	_readTag(tagIndex, pageNum) {
		debug('readTag: Sending command to read the %d page for tag with index %d', pageNum, tagIndex);
		debug('Note: This is still experimental, responses are not yet emitted (still figuring out how to parse)');
		debug(
			'Index used for request: %d (will need this when getting results. Probably. It is experimental, remember?)',
			this._index
		);
		this._write([0x55, 0x04, 0xd2, this._commandIndex(), tagIndex & 0xff, pageNum & 0xff]);
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
		var out = {
			command: commands[data[1]] || null,
			commandRaw: data[1],
			// include raw data for figuring out new commands
			dataRaw: data
		};
		// parse command specific data:
		switch(out.command) {
			case 'minifig-scan':
				out.panel = data[2];
				out.minifigIndex = data[4];
				out.action = data[5];
				out.uid = data.slice(7, 13);
				break;

			case 'connected':
				// todo: any interesting / useful info to extract?

			case 'tag-not-found':
				// todo

			case 'tag-read':
				// todo

			case 'led-change':
				// todo

		}
		debug('Parsed data for emit: %o', out);
		this.emit('data', out);
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
