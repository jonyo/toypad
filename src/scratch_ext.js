(function (ext) {
	var socket = null,
		connected = false,
		minifigsAdded = {},
		minifigsRemoved = {},
		speeds = {
			SLOW: 0,
			MEDIUM: 0.5,
			FAST: 1.0
		},
		minifigs = [
			'WILDSTYLE', 'BATMAN', 'GANDOLF', 'BATMOBILE',

			// Custom NFC Tags
			'STEVE', 'MINECART', 'IRONMAN', 'IRONCAR', 'WENDY', 'WENDYCAR'
		],
		panels = ['ALL', 'LEFT', 'RIGHT', 'CENTER'];

	// Fill in the starting values for the hat
	for (var i = 0; i < panels.length; i++) {
		minifigsAdded[panels[i]] = {};
		minifigsRemoved[panels[i]] = {};
		for (var m = 0; m < minifigs.length; m++) {
			minifigsAdded[panels[i]][minifigs[m]] = false;
			minifigsRemoved[panels[i]][minifigs[m]] = false;
		}
	}

	var addMinifig = function (panel, minifig) {
		console.log('addMinifig');
		console.log(panel, minifig);
		minifigsAdded[panel][minifig] = true;
		minifigsRemoved[panel][minifig] = false;
		if (panel !== 'ALL') {
			addMinifig('ALL', minifig);
		}
	};

	var removeMinifig = function (panel, minifig) {
		console.log('removeMinifig');
		console.log(panel, minifig);
		minifigsAdded[panel][minifig] = false;
		minifigsRemoved[panel][minifig] = true;
		if (panel !== 'ALL') {
			removeMinifig('ALL', minifig);
		}
	};

	ext.cnct = function (callback) {
		console.log('connecting...');
		if (connected) {
			console.log('already connected');
			callback();
			return;
		}
		socket = new WebSocket("ws://127.0.0.1:8080");
		socket.onopen = function () {
			connected = true;
			console.log('connected to toypad.');
			callback();
		};

		socket.onmessage = function (message) {
			console.log('got message...');
			console.log(message);
			var data = JSON.parse(message.data);
			if (!data || !data.command) {
				console.log('invalid message, not json or no command');
				console.log(data);
			}
			console.log('parsed message:');
			console.log(data);

			switch (data.command) {
				case 'minifigAdd':
					addMinifig(data.panel.name, data.minifig.name);
					break;

				case 'minifigRemove':
					removeMinifig(data.panel.name, data.minifig.name);
					break;
			}
		};

		socket.onclose = function (e) {
			console.log("Connection closed.");
			socket = null;
			connected = false;
		};
	};

	// Cleanup function when the extension is unloaded
	ext._shutdown = function () {
		var msg = JSON.stringify({
			"command": "shutdown"
		});
		socket.send(msg);
	};

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	ext._getStatus = function () {
		var myStatus = 1;
		var myMsg = 'Not Connected to Toypad';
		if (connected) {
			myStatus = 2;
			myMsg = 'Toypad connected';
		}
		return {status: myStatus, msg: myMsg};
	};

	ext.fadePanel = function(panel, color, speed) {
		console.log('fadePanel');
		if (!connected) {
			console.log('Not connected to toypad!');
			return;
		}
		speed = speeds[speed];
		console.log(speed, color, panel);
		msg = {
			command: 'fadePanel',
			panel: panel,
			color: color,
			speed: speed
		};
		socket.send(JSON.stringify(msg));
	}.bind(ext);

	ext.changePanel = function(panel, color) {
		console.log('changePanel');
		if (!connected) {
			console.log('Not connected to toypad!');
			return;
		}
		msg = {
			command: 'changePanel',
			panel: panel,
			color: color
		};
		socket.send(JSON.stringify(msg));
	}.bind(ext);

	ext.minifigAdded = function(minifig, panel) {
		if (minifigsAdded[panel][minifig]) {
			minifigsAdded[panel][minifig] = false;
			return true;
		}
		return false;
	}.bind(ext);

	ext.minifigRemoved = function(minifig, panel) {
		if (minifigsRemoved[panel][minifig]) {
			minifigsRemoved[panel][minifig] = false;
			return true;
		}
		return false;
	}.bind(ext);

	// Block and block menu descriptions
	var descriptor = {
		blocks: [
			['h', 'When %m.minifig added to %m.panel', 'minifigAdded', 'STEVE', 'ALL'],
			['h', 'When %m.minifig removed from %m.panel', 'minifigRemoved', 'STEVE', 'ALL'],
			['w', 'Connect to the toypad.', 'cnct'],
			[' ', 'Fade %m.panel color to %m.color %m.speed', 'fadePanel', 'ALL', 'WHITE', 'FAST'],
			[' ', 'Change %m.panel color to %m.color', 'changePanel', 'ALL', 'WHITE']
		],
		menus: {
			panel: panels,
			color: ['OFF', 'RED', 'GREEN', 'BLUE', 'PURPLE', 'WHITE'],
			speed: ['SLOW', 'MEDIUM', 'FAST'],
			minifig: minifigs
		}
	};

	// Register the extension
	ScratchExtensions.register('toypad', descriptor, ext);
})({});
