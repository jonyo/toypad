var Device = require('./device.js');


var toypad = new Device();

toypad.connect();

toypad.on('connected', function() {
	console.log('connected');
});

// keep track of what minifig is on what panel
toypad.on('minifig-scan', function(e) {
	if (e.action === toypad.actions.ADD) {
		console.log('Minifig Added...');
		if (e.minifig) {
			e.panel.addMinifig(e.minifig);
			toypad.panels.names.ALL.addMinifig(e.minifig);
		}
	} else if (e.action === toypad.actions.REMOVE) {
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
