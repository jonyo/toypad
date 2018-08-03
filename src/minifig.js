module.exports = (function () {
	var minifigById = {};

	var minifig = function () {
	};

	minifig.prototype.byId = function (id) {
		return minifigById[id] || null;
	};

	var add = function (name, id) {
		if (name === 'byId') {
			return;
		}
		var figure = {
			id: id,
			name: name
		};
		minifig[name] = figure;
		minifigById[id] = figure;
	};


	// Figure definitions

	add('WILDSTYLE', '4b 2b ea 0b 40 81');
	add('BATMAN', '24 51 ba 0d 40 81');
	add('GANDALF', '60 62 6a 08 40 80');
	add('BATMOBILE', '66 d2 9a 70 40 80');

	// Custom NFC Tags
	add('STEVE', '65 9e 22 4c 58 80');
	add('MINECART', '58 a9 62 58 58 80');
	add('IRONMAN', '7c 9e 22 4c 58 80');
	add('IRONCAR', '5a a9 62 58 58 80');
	add('WENDY', '7a 9e 22 4c 58 80');
	add('WENDYCAR', '42 a9 62 58 58 80');

	return minifig;
})();

