var Device = require('./device.js'),
	panel = require('./panel.js'),
	minifig = require('./minifig.js'),
	color = require('./color.js');

var toypad = new Device();
toypad.connect();

// sample to turn it red
toypad.updatePanel(panel.ALL, color.RED, 0.5);

toypad.disconnect();

module.exports = toypad;
