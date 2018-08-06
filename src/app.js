const Device = require('./device.js');
const WebSocket = require('ws');

let wss = new WebSocket.Server({ port: 8080 }),
	toypad = new Device(),
	socket = null;

console.log(toypad);


toypad.on('connected', function() {
	console.log('connected to toypad');
});

toypad.connect();

toypad.on('minifig-scan', function(e) {
	console.log('received minifig-scan');
	console.log(e);
	console.log(toypad.actions);
	if (!e.minifig) {
		// do not care if it is not known minifig
		console.log('unknown minifig, ignoring...');
		return;
	}
	if (!socket) {
		console.log('No connection established to scratch');
		return;
	}
	if (e.action === toypad.actions.ADD) {
		console.log('sending minifigAdd command to scratch');
		socket.send(JSON.stringify({command: 'minifigAdd', panel: e.panel, minifig: e.minifig}));
	} else if (e.action === toypad.actions.REMOVE) {
		console.log('sending minifigRemove command to scratch');
		socket.send(JSON.stringify({command: 'minifigRemove', panel: e.panel, minifig: e.minifig}));
	} else {
		console.log('action not known... ', e.action);
	}
});

console.log('count', toypad.listenerCount('minifig-scan'));

wss.on('connection', function connection(ws) {
	console.log('connection established to scratch extension...');
	socket = ws;
	ws.on('message', function incoming(message) {
		var data = JSON.parse(message);
		switch (data.command) {
			case 'panelChange':
				var panel = toypad.panels[data.panel] || null;
				if (!panel) {
					return;
				}
				var color = toypad.colors[data.color] || null;
				if (color === null) {
					return;
				}
				toypad.panelChange(panel, color);
				break;

			case 'panelFade':
				var panel = toypad.panels[data.panel] || null;
				if (!panel) {
					return;
				}
				var color = toypad.colors[data.color] || null;
				if (color === null) {
					return;
				}
				if (typeof data.secondsPerChange === 'undefined') {
					return;
				}
				if (typeof data.changeCount === 'undefined') {
					return;
				}
				toypad.panelFade(panel, color, parseFload(data.secondsPerChange), parseInt(data.changeCount));
				break;

			case 'panelFlash':
				var panel = toypad.panels[data.panel] || null;
				if (!panel) {
					return;
				}
				var color = toypad.colors[data.color] || null;
				if (color === null) {
					return;
				}
				if (typeof data.onSecondsPerChange === 'undefined') {
					return;
				}
				if (typeof data.offSecondsPerChange === 'undefined') {
					return;
				}
				if (typeof data.changeCount === 'undefined') {
					return;
				}
				toypad.panelFlash(
					panel,
					color,
					parseFloat(data.onSecondsPerChange),
					parseFloat(data.offSecondsPerChange),
					parseInt(data.changeCount)
				);
				break;

			case 'shutdown':
				// todo: anything to do?
				console.log('shutdown received from scratch');
				break;

			default:
				console.log('Unknown command received from scratch', data.command);
				console.log(data);
				break;
		}
	});
});
