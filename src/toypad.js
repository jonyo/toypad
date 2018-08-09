const Device = require('./device.js');
const debug = require('debug')('toypad');


var toypad = new Device();

// TODO: turn this into just a wrapper that keeps track of what panels have what minifigs on them...

toypad.connect();

toypad.on('connected', function() {
	debug('connected');
});

// keep track of what minifig is on what panel, also light up panels with something on it
toypad.on('minifig-scan', function(e) {
	var seconds = .3;
	if (e.action === toypad.actions.ADD) {
		debug('Minifig Added...');
		// todo: probably will remove this...
		//toypad._readTag(e.tagIndex, 0x26);
		if (e.minifig) {
			//e.panel.addMinifig(e.minifig, e.tagIndex);
			toypad.panels.ALL.addMinifig(e.minifig);
		} else {
			debug('Unknown minifig, uid: %s', e.uid);
		}
		toypad.panelChange(e.panel, toypad.colors.RED);
	} else if (e.action === toypad.actions.REMOVE) {
		debug('Minifig Removed...');
		if (e.minifig) {
			e.panel.removeMinifig(e.minifig);
			toypad.panels.ALL.removeMinifig(e.minifig);
		}
		toypad.panelChange(e.panel, toypad.colors.WHITE);
  	} else {
  		debug('other action... %s', e.action);
  	}
});

// disconnect right away...
//toypad.disconnect();

module.exports = toypad;
