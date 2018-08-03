const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const toypad = require('./toypad.js');


wss.on('connection', function connection(ws) {
	console.log('connection established...');
	ws.on('message', function incoming(message) {
		var data = JSON.stringify(message);
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
				break;
		}
	});

	ws.send('something');
});
