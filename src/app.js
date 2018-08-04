var Device = require('./device.js'),
	WebSocket = require('ws'),
	wss = new WebSocket.Server({ port: 8080 }),
	toypad = new Device(),
	socket = null;

toypad.connect();

toypad.on('connected', function() {
	console.log('connected to toypad');
});

toypad.on('minifig-scan', function(e) {
	if (!e.minifig) {
		// do not care if it is not known minifig
		console.log('minifig added but unknown so ignoring...');
		return;
	}
	if (!socket) {
		console.log('No connection established so no commands to send');
		return;
	}
	if (e.action === toypad.actions.ADD) {
		console.log('sending minifigAdd command');
		socket.send(JSON.stringify({command: 'minifigAdd', panel: e.panel, minifig: e.minifig}));
	} else if (e.action === toypad.actions.REMOVE) {
		console.log('sending minifigRemove command');
		socket.send(JSON.stringify({command: 'minifigRemove', panel: e.panel, minifig: e.minifig}));
	} else {
		console.log('action not known... ', e.action);
	}
});

wss.on('connection', function connection(ws) {
	console.log('connection established to scratch extension...');
	socket = ws;
	ws.on('message', function incoming(message) {
		var data = JSON.parse(message);
		switch (data.command) {
			case 'updatePanel':
				var panel = toypad.panels.names[data.panel] || null;
				if (!panel) {
					return;
				}
				var color = toypad.colors[data.color] || null;
				if (color === null) {
					return;
				}
				var speed = data.speed;
				toypad.updatePanel(panel, color, speed);
				break;

			case 'shutdown':
				// todo: anything to do?
				break;

			default:
				console.log('Unknown command', data.command);
				console.log(data);
				console.log(message);
				break;
		}
	});
});
