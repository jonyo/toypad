let uids = {},
	names = {};

class Minifig {
	constructor (name, uid) {
		this.uid = uid;
		this.name = name;
	}

	static add (name, uid) {
		var minifig = new Minifig(name, uid);
		uids[uid] = minifig;
		names[name] = minifig;
	}

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

// Figure definitions
Minifig.add('WILDSTYLE', '4b 2b ea 0b 40 81');
Minifig.add('BATMAN', '24 51 ba 0d 40 81');
Minifig.add('GANDALF', '60 62 6a 08 40 80');
Minifig.add('BATMOBILE', '66 d2 9a 70 40 80');

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
