/**
 * This is a simple example that just prints out the UID of whatever character, even the full line of code that you
 * would need to add to your own script to define the minifig.  This is necessary because each minifig is unique, one
 * Batmat minifig UID does not match another batman minifig UID.  The official Lego Dimensions actually reads the
 * actual contents of the NFC tag to discover what each minifig is rather than going by the UID, but that level of
 * interaction is not (yet) possible with this library.
 */

const Toypad = require('dimensions-toypad');

var toypad = new Toypad();
toypad.connect();

toypad.on('minifig-scan', function (e) {
	console.log('Minifig '+e.action.name+'\'ed with UID: '+e.uid);
	console.log('To define the minifig, use a line like below, replace NAME with whatever you want to name that minifig.');
	console.log('');
	console.log('Toypad.add(new Toypad.Minifig(\'NAME\', \'' + e.uid + '\'));');
	console.log('');
});
