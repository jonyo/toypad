module.exports = (function() {
	var panelsByCode = {};
	var panel = function (){};

	panel.prototype.add = function(name, code) {
		var act = {
			code: code,
			name: name
		};
		this.prototype[name] = act;
		panelsByCode[code] = act;
	};

	panel.prototype.byCode = function(code) {
		return panelsByCode[code] || null;
	}

	panel.add('ALL', 0);
	panel.add('CENTER', 1);
	panel.add('LEFT', 2);
	panel.add('RIGHT', 3);

	return panel;
});
