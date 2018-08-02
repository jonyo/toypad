module.exports = (function() {
	var panelsByCode = {},
		color = require('./color.js');

	var panel = function (){};

	panel.prototype.byCode = function (code) {
		return panelsByCode[code] || null;
	};

	var add = function(name, code) {
		if (name === 'byCode') {
			return;
		}
		var info = {
			code: code,
			name: name,
			minifigs: {},
			color: color.OFF
		};
		panel[name] = info;
		panelsByCode[code] = info;
	};

	add('ALL', 0);
	add('CENTER', 1);
	add('LEFT', 2);
	add('RIGHT', 3);

	return panel;
})();
