module.exports = (function() {
	var actionsByCode = {};
	var action = function (){};

	action.prototype.add = function(name, code) {
		var act = {
			code: code,
			name: name
		};
		this.prototype[name] = act;
		actionsByCode[code] = act;
	};

	action.prototype.byCode = function(code) {
		return actionsByCode[code] || null;
	}

	action.add('ADD', 0);
	action.add('REMOVE', 1);

	return action;
});
