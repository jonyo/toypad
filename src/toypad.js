var Device = require('./device.js');


var toypad = new Device();

toypad.connect();

toypad.on('connected', function() {
	console.log('connected');
});

// keep track of what minifig is on what panel, also light up panels with something on it
toypad.on('minifig-scan', function(e) {
	var seconds = .3;
	if (e.action === toypad.actions.ADD) {
		console.log('Minifig Added...');
		if (e.minifig) {
			e.panel.addMinifig(e.minifig);
			toypad.panels.ALL.addMinifig(e.minifig);
		}
		toypad.fadePanel(e.panel, toypad.colors.RED, seconds);
	} else if (e.action === toypad.actions.REMOVE) {
		console.log('Minifig Removed...');
		if (e.minifig) {
			e.panel.removeMinifig(e.minifig);
			toypad.panels.ALL.removeMinifig(e.minifig);
		}
		toypad.fadePanel(e.panel, toypad.colors.OFF, seconds);
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
