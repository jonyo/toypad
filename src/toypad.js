var Device = require('./device.js'),
	Minifig = require('./minifig.js'),
	Color = require('./color.js'),
	Action = require('./action.js');


var toypad = new Device();

toypad.connect();

toypad.on('connected', function() {
	console.log('connected');
});

// Simple thing to change any panel with a minifig on it to purple
toypad.on('minifig-scan', function(e) {
	if (e.action === Action.ADD) {
		console.log('Minifig Added...');
		if (e.minifig) {
			e.panel.addMinifig(e.minifig);
			toypad.panels.names.ALL.addMinifig(e.minifig);
		}
	} else if (e.action === Action.REMOVE) {
		console.log('Minifig Removed...');
		if (e.minifig) {
			e.panel.removeMinifig(e.minifig);
			toypad.panels.names.ALL.removeMinifig(e.minifig);
		}
  	} else {
  		console.log('other action...', e.action);
  		console.log(e);
  	}
	console.log('panel', e.panel);
	console.log('minifig', e.minifig);
	console.log('id', e.id);
});

// disconnect right away...
//toypad.disconnect();

module.exports = toypad;
