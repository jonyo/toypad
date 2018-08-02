var Device = require('./device.js'),
	panel = require('./panel.js'),
	minifig = require('./minifig.js'),
	colors = require('./colors.js');

var toypad = new Device();
toypad.connect();

// sample to turn it red
toypad.updatePanel(panel.ALL, colors.RED, 0.5);

toypad.disconnect();

module.exports = toypad;
