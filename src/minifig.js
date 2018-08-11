/**
 * @module toypad/minifig
 */
const debug = require('debug')('toypad:minifig');

/**
 * Minifig class, defines in individual minifig and keeps track of all defined minifigs.
 */
class Minifig {
	/**
	 * Initialize the minifig
	 * @param  {string} name
	 * @param  {string} uid  String representation of the hex UID, like '4b 2b ea 0b 40 81'
	 */
	constructor (name, uid) {
		this.uid = uid;
		this.name = name;
		this._index = null;
	}

	/**
	 * Once set it cannot be changed as the toypad will continue to use the same index, even if the minifig is removed
	 * and added to a different panel. Note that this is normally set internally when a defined minifig is added to a
	 * panel. It is set to null until the first time the minifig is scanned (added to the toypad). Note that it can be
	 * 0 so be sure to account for null vs. 0
	 * It is needed to make a memory read request (still experimental).
	 * @type {number}
	 */
	get index () {
		return this._index;
	}

	set index (value) {
		if (this._index === value) {
			// already set to this...
			return;
		}
		if (this._index !== null) {
			debug('Attempting to change tagIndex is not permitted after already set.');
			return;
		}
		this._index = value;
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


	/**
	 * Add a minifig to the list with its own name
	 * @param {Minifig} minifig
	 */
	static add (minifig) {
		Minifig.uids[minifig.uid] = minifig;
		Minifig.names[minifig.name] = minifig;
	}
}

/**
 * List of minifigs by name
 * @type {object.<string, module:toypad/minifig.Minifig>}
 */
Minifig.names = {};

/**
 * List of minifigs by uid
 * @type {object.<string, module:toypad/minifig~Minifig>}
 */
Minifig.uids = {};

/**
 * Minifig class
 * @type {module:toypad/minifig~Minifig}
 */
module.exports = Minifig;
