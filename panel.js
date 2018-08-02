module.exports = (function() {
	var panelsByCode = {};
	var panel = function (){};

	panel.prototype.byCode = function(code) {
		return panelsByCode[code] || null;
	};

	var add = function(name, code) {
		if (name === 'byCode') {
			return;
		}
		var section = {
			code: code,
			name: name
		};
		panel.prototype[name] = section;
		panelsByCode[code] = section;
	};

	add('ALL', 0);
	add('CENTER', 1);
	add('LEFT', 2);
	add('RIGHT', 3);

	return panel;
})();
