/**
 * This is an example of how to use the module, it sets up some interactivity with the toypad.
 */

const Toypad = require('jonyo/toypad');

// You would normally define your minifig UID's to enable interacting based on which minifig was added...  Also the
// minifig counts require the minifig added to be defined.
// NOTE: check out examples/uid-discover.js for a simple example script that will print out UID of minifigs added to the
// toypad
Toypad.Minifig.add(new Toypad.Minifig('WILDSTYLE', '4b 2b ea 0b 40 81'));
Toypad.Minifig.add(new Toypad.Minifig('BATMAN', '24 51 ba 0d 40 81'));
Toypad.Minifig.add(new Toypad.Minifig('GANDALF', '60 62 6a 08 40 80'));

// Add a custom NFC tag:
Toypad.Minifig.add(new Toypad.Minifig('STEVE', '65 9e 22 4c 58 80'));

// Create a new toypad instance and connect to the actual toypad
var toypad = new Toypad();
toypad.connect();

toypad.on('connected', function() {
	// Turn all the pads WHITE when we initially connect
	toypad.panelChange(Toypad.panels.ALL, Toypad.colors.WHITE);
});

toypad.on('minifig-scan', function(e) {
	// Change panel color according to how many minifigs are on the panel:
	// 0: white
	// 1: blue
	// 2: green
	// 3: red
	var color = Toypad.colors.WHITE;
	var count = e.panel.minifigCount();
	if (count > 2) {
		color = Toypad.colors.RED;
	} else if (count > 1) {
		color = Toypad.colors.GREEN;
	} else if (count > 0) {
		color = Toypad.colors.BLUE;
	}
	// change panel to that color...
	toypad.panelChange(e.panel, color);
	// Also if it is "adding" a minifig, make that panel pulse
	if (e.action === Toypad.actions.ADD) {
		// Fade in and out when one is added
		toypad.panelFade(e.panel, Toypad.colors.OFF, .5, 4);
	}
});
