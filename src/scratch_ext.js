(function (ext) {
	var socket = null,
		connected = false,
		minifigsAdded = {},
		minifigsRemoved = {},
		speeds = {
			SLOW: 1.0,
			MEDIUM: 0.5,
			FAST: 0.1
		},
		minifigs = [
			'BOB', 'FRED', 'STICKER', 'WILDSTYLE', 'BATMAN', 'GANDOLF'
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
		minifigAdded[panel][minifig] = true;
		minifigRemoved[panel][minifig] = false;
		if (panel !== 'ALL') {
			addMinifig('ALL', minifig);
		}
	};

	var removeMinifig = function (panel, minifig) {
		minifigAdded[panel][minifig] = false;
		minifigRemoved[panel][minifig] = true;
		if (panel !== 'ALL') {
			removeMinifig('ALL', minifig);
		}
	};

	ext.cnct = function (callback) {
		console.log('connecting...');
		socket = new WebSocket("ws://127.0.0.1:8080");
		socket.onopen = function () {
			connected = true;
			// give the connection time establish
			window.setTimeout(function() {
				callback();
			}, 1000);
		};

		socket.onmessage = function (message) {
			var data = JSON.parse(message);
			if (!data || !data.command) {
				console.log('data received, not valid');
				console.log(data);
				console.log(message);
			}
			console.log('message received');
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
		var myMsg = 'Not Connected to Gamepad';
		if (connected) {
			myStatus = 2;
			myMsg = 'Toypad connected';
		}
		return {status: myStatus, msg: myMsg};
	};

	ext.updatePanel = function(panel, color, speed) {
		console.log('updatePanel');
		if (!connected) {
			console.log('Not connected to server!');
			return;
		}
		speed = speeds[speed];
		console.log(speed, color, panel);
		msg = {
			command: 'updatePanel',
			panel: panel,
			color: color,
			speed: speed
		};
		socket.send(JSON.stringify(msg));
	}.bind(ext);

	ext.minifigAdded = function(minifig, panel) {
		console.log('polling minifigAdded for... ', panel, minifig);
		if (!minifigsAdded[panel]) {
			minifigsAdded[panel] = {};
		}
		var added = minifigsAdded[panel][minifig] || false;
		// "consume" the added minifig
		minifigsAdded[panel][minifig] = false;
		return added;
	}.bind(ext);

	ext.minifigRemoved = function(minifig, panel) {
		if (!minifigsRemoved[panel]) {
			minifigsRemoved[panel] = {};
		}
		var removed = minifigsRemoved[panel][minifig] || false;
		// "consume" the removed minifig
		minifigsRemoved[panel][minifig] = false;
		return removed;
	}.bind(ext);

	// Block and block menu descriptions
	var descriptor = {
		blocks: [
			['h', 'When %m.minifig added to %m.panel', 'minifigAdded', 'BOB', 'ALL'],
			['h', 'When %m.minifig removed from %m.panel', 'minifigRemoved', 'BOB', 'ALL'],
			["w", 'Connect to the toypad.', 'cnct'],
			['w', 'set %m.panel color to %m.color %m.speed', 'updatePanel', 'ALL', 'OFF', 'SLOW']
		],
		menus: {
			panel: panels,
			color: ['OFF', 'RED', 'GREEN', 'BLUE', 'PURPLE', 'WHITE'],
			speed: ['SLOW', 'MEDIUM', 'FAST'],
			minifig: minifigs,
		}
	};

	// Register the extension
	ScratchExtensions.register('toypad', descriptor, ext);
})({});
