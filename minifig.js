module.exports = (function () {
	var minifigById = {};

	var minifig = function () {
	};

	minifig.prototype.add = function (name, id) {
		var figure = {
			id: id,
			name: name
		};
		this.prototype[name] = figure;
		minifigById[id] = figure;
	};

	minifig.prototype.byId = function (id) {
		return minifigById[id] || null;
	};

	// Figure definitions

	minifig.add('WILDSTYLE', '4b 2b ea 0b 40 81');
	minifig.add('BATMAN', '24 51 ba 0d 40 81');
	minifig.add('GANDALF', '60 62 6a 08 40 80');
	minifig.add('BATMOBILE', '66 d2 9a 70 40 80');

	return minifig;
})();

