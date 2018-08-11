# dimensions-toypad

This is a library that can be used to interact with the Lego Dimensions toypad.  This project is an independent project meant to let you interact with the toypad outside of the game itself.

# Installation
You can install it in your own project:
```js
npm install dimensions-toypad --save
```

# Usage

There are several example scripts that illustrate how to use the library.  You can find simple examples below.

## Load the dimensions-toypad module

```js
const Toypad = require('dimensions-toypad');
```

## Connect to the toypad

```js
const Toypad = require('dimensions-toypad');

var toypad = new Toypad();
toypad.connect();
```

## Actions emitted

There are a few actions that are emitted, see below.

### connected
Allow you to do something when the connection is established.
```js
const Toypad = require('dimensions-toypad');

var toypad = new Toypad();
toypad.connect();
toypad.on('connected', function () {
	console.log('Connected to toypad!');
	// can do something here like turn all the panel colors white or something...
});
```

### minifig-scan
Happens when a minifig (or any NFC tag) is added or removed from the toypad.  Also when initially connecting to the toypad, if there are any figures already on the toypad it will trigger an add for each figure.

```js
const Toypad = require('dimensions-toypad');

var toypad = new Toypad();
toypad.connect();
toypad.on('minifig-scan', function (e) {
	console.log('Minifig was ' + e.action.name + '-ed!');
	console.log('Minifig name: ' + e.minifig.name || 'Not Defined!');
	console.log('Minifig UID: ' + e.uid);
	console.log('Panel: ' + e.panel.name);
});
```

### Reading memory?

We are working on reading memory, it is still experimental but you can see what we have figured out so far in `src/device.js` in the `_readTag`.  Look for it being completed possibly in a future release.

## Changing the panel colors
There are 3 main ways to change the panel colors, then the accompanying way to do the same type of change on multiple panels at once.

For each of the different ways, it will use the panel and the color to change to.

**Panel:** There are 4 panels defined:

* `Toypad.panels.ALL` - all panels, using this will apply the same change to all panels.
* `Toypad.panels.CENTER`
* `Toypad.panels.LEFT`
* `Toypad.panels.RIGHT`

**Color:** There are 5 colors pre-defined.  Note that you can also define your own custom colors, see the example script at `src/examples/more-colors.js` for more info.

* `Toypad.colors.OFF` - this is like "black" but it translates to turning off the panel.
* `Toypad.colors.WHITE`
* `Toypad.colors.RED`
* `Toypad.colors.GREEN`
* `Toypad.colors.BLUE`

### Simple change: panelChange

```js
// change the center panel blue immediately
toypad.panelChange(Toypad.panels.CENTER, Toypad.colors.BLUE);
```

### Fade / Pulse: panelFade
```js
// Fade from the current color to green, taking 2 seconds
toypad.panelFade(Toypad.panels.LEFT, Toypad.colors.GREEN, 2, 1);

// Pulse the pad several times between the current color and red, each color change taking half a second, and doing 6
// changes.  It will end up on the previous color since the change count is even.
toypad.panelFade(Toypad.panels.RIGHT, Toypad.colors.RED, .5, 6);

// Do the same pulse, but this time only change 5 times (odd number), so it will end up on the new color
toypad.panelFade(Toypad.panels.CENTER, Toypad.colors.RED, .5, 5);
```

### Flash (like pulse, but no fading between colors): panelFlash
```js
// flash 5 times very fast, ending on the new color since the flash count is an odd number
toypad.panelFlash(Toypad.panels.RIGHT, Toypad.colors.RED, .5, .1, 1);
```

### Changing multiple panels at once

Each of the different ways has a plural version, like `panelChange` has `panelsChange`.  Each one takes 3 arguments, which are the options for the center panel, left panel, and right panel respectively.  See the jsdocs on each of the methods for the full info.

### Using 0 for any "second" options
It is best to avoid using 0 for any of the timings on any of the fade or flash methods, if you want to immediately switch to a new color use `panelChange` to avoid odd behavior.  In particular, when you fade with 0 seconds, it can switch to the new color but the next transition(s) you do it will act like it is still on the old color.  We've also seen other really odd behavior that only seems to happen when using a fade or flash with 0 seconds so it is best to avoid that.

### Use panelChange to ensure "previous" color is what you expect
If you start a new color change before the old one is done, sometimes it can be kind of weird.  To avoid weird behavior especially when using an even number of changes (so you want it to end on the previous color), use `panelChange` to ensure it ends on the previous color you are expecting.

## Code examples

See the examples in the `src/examples/` folder for working examples.

# Minifigure UID

The main way this library interacts with minifigures is through the "UID" of each figure, which is unique for each individual minifigure.  They will not be the same for any 2 sets of games, so the UID for one batman will be different than the UID for another batman.  You will need to discover the UID for your own minifigures, see the `src/examples/uid-discover.js` for an example script that can be used to figure out what your own minifigure UIDs are.

Once you find the UID of each minifigure and add the definition to your script, you can make code specific to the minifigure, for example you could make the pad turn a certain color if Batman is added.

# NFC Tags

In addition to the minifigures that come with the Lego Dimensions game, it can also work with other things using NFC technology, like Nintindo Amiibo figures and Disney Infinity figures.  It will also work with your own custom NFC tags so it is possible to create your own NFC tag. You can find NFC tags online in the form of stickers that can be stuck to whatever you want.

You would just need to find out the UID (see the Minifigure UID section above) and you can start using anything that uses NFC tags.

# Debug
This project uses the debug library for debug messages.  If you are not familiar, it allows turning on debug messages from specific sources depending on `DEBUG` environment variable.  All the debug messages in this library use `dimensions-toypad` prefix.

Enable just the main top-level messages
```bash
DEBUG=dimensions-toypad node my-script.js
```

Enable only "device" messages:
```bash
DEBUG=dimensions-toypad:device node my-script.js
```
There are other levels as well, you can see them all with a wildcard:

Enable all messages from this library (VERY verbose):
```bash
DEBUG=dimensions-toypad* node my-script.js
```

# Reference

In this library I stand on the shoulders of others, adding to work that was previously done.  Below are the references I used when making this library.

* [node-dimensions](https://github.com/mpetrov/node-dimensions) Though internally a lot is different, the API for this library is very similar to node-dimensions as we used that as the starting point for this library.
* [lego_dimensions_protocol](https://github.com/woodenphone/lego_dimensions_protocol)
