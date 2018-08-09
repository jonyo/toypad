const debug = require('debug')('toypad:minifig');
let uids = {},
	names = {};

class Minifig {
	constructor (name, uid) {
		this.uid = uid;
		this.name = name;
		this._tagIndex = -1;
	}

	/**
	 * Get the tag index referenced by the device
	 * @return {number} The tag index, will be -1 if the minifig has not been scanned by the device yet and indicates
	 * no tag index has been set.
	 */
	get tagIndex() {
		return this._tagIndex;
	}

	/**
	 * Set the tag index, once set it cannot be changed as the toypad will continue to use the same index, even if the
	 * minifig is removed and added to a different panel.  This is normally called internally when a minifig is added
	 * to a panel for the first time.
	 * @param {number} value
	 */
	set tagIndex (value) {
		if (this._tagIndex === value) {
			// already set to this...
			return;
		}
		if (this._tagIndex !== -1) {
			debug('Attempting to change tagIndex is not permitted after already set.');
			return;
		}
		this._tagIndex = value;
	}

	/**
	 * Add a minifig to the list with its own name
	 * @param {string} name Name of the minifig
	 * @param {string} uid String representation of the minifig, something like '4b 2b ea 0b 40 81'
	 */
	static add (name, uid) {
		var minifig = new Minifig(name, uid);
		uids[uid] = minifig;
		names[name] = minifig;
	}

	/**
	 * Convert buffer to string that is used for the UID of a minifig
	 * @param {buffer} buffer
	 * @return {string}
	 */
	static bufferToUid (buffer) {
		var uid = '';
		for (var i = 0; i < buffer.length; i++) {
			uid +=
				((buffer[i] >> 4) & 0xF).toString(16) +
				(buffer[i] & 0xF).toString(16) +
				' ';
		}
		return uid.trim();
	}
}

// TODO: UID's are not shared for same figure, so remove from here and add examples on how to add your own
// Figure definitions
Minifig.add('WILDSTYLE', '4b 2b ea 0b 40 81');
Minifig.add('BATMAN', '24 51 ba 0d 40 81');
Minifig.add('GANDALF', '60 62 6a 08 40 80');
Minifig.add('BATMOBILE', '66 d2 9a 70 40 80');
Minifig.add('CHELL', '71 93 52 77 3f 81');
Minifig.add('VOLDEMORT', 'e5 30 0a 56 49 80');

// Custom NFC Tags
Minifig.add('STEVE', '65 9e 22 4c 58 80');
Minifig.add('MINECART', '58 a9 62 58 58 80');
Minifig.add('IRONMAN', '7c 9e 22 4c 58 80');
Minifig.add('IRONCAR', '5a a9 62 58 58 80');
Minifig.add('WENDY', '7a 9e 22 4c 58 80');
Minifig.add('WENDYCAR', '42 a9 62 58 58 80');

exports.names = names;
exports.uids = uids;
exports.Minifig = Minifig;
