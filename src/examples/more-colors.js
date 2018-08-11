/**
 * Example of adding more colors other than the built-in RED, GREEN, BLUE, WHITE, OFF
 *
 * It does not translate exactly to RGB values you might see on the screen, it takes a bit of experimenting to get the
 * color like you want.  Each one, R G B value is for how bright to make that color's LED with 00 being "off" and ff
 * being "full power".  So the colors will not look just like the same RGB values you would see on the screen.
 */
const Toypad = require('dimensions-toypad');

// Add NAVY color RED: 02 (2) GREEN: 08 (8) BLUE: 10 (16)
Toypad.Color.add(new Toypad.Color('NAVY', 0x020810));

var toypad = new Toypad();
toypad.connect();
toypad.on('connected', function () {
	// use the custom color we added, to change all panels to navy...
	toypad.panelChange(Toypad.panels.ALL, Toypad.colors.NAVY)
	// disconnect since we are not adding any interactivity, it will stay that color as long as it is still plugged
	// into the USB and the computer is on.
	toypad.disconnect();
});

