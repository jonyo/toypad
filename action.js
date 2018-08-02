module.exports = (function() {
	var actionsByCode = {};
	var action = function (){};

	action.prototype.byCode = function(code) {
		return actionsByCode[code] || null;
	}

	var add = function(name, code) {
		if (name === 'byCode') {
			return;
		}
		var act = {
			code: code,
			name: name
		};
		action.prototype[name] = act;
		actionsByCode[code] = act;
	};


	add('ADD', 0);
	add('REMOVE', 1);

	return action;
});
