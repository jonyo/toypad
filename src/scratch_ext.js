(function (ext) {
	var socket = null,
		connected = false,
		minifigsAdded = {},
		minifigsRemoved = {},
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

	ext.panelChange = function(panel, color) {
		console.log('panelChange');
		if (!connected) {
			console.log('Not connected to toypad!');
			return;
		}
		msg = {
			command: 'panelChange',
			panel: panel,
			color: color
		};
		socket.send(JSON.stringify(msg));
	}.bind(ext);

	ext.panelFade = function(panel, color, secondsPerChange) {
		console.log('panelFade');
		this.panelPulse(panel, color, 1, secondsPerChange);
	}.bind(ext);

	ext.panelPulse = function(panel, color, changeCount, secondsPerChange) {
		console.log('panelPulse');
		if (!connected) {
			console.log('Not connected to toypad!');
			return;
		}
		console.log(panel, color, secondsPerChange);
		msg = {
			command: 'panelFade',
			panel: panel,
			color: color,
			secondsPerChange: secondsPerChange,
			changeCount: changeCount
		};
		socket.send(JSON.stringify(msg));
	}.bind(ext);

	ext.panelFlash = function(panel, color, changeCount, onSecondsPerChange, offSecondsPerChange) {
		console.log('panelPulse');
		if (!connected) {
			console.log('Not connected to toypad!');
			return;
		}
		console.log(panel, color, secondsPerChange);
		msg = {
			command: 'panelFlash',
			panel: panel,
			color: color,
			onSecondsPerChange: onSecondsPerChange,
			offSecondsPerChange: offSecondsPerChange,
			changeCount: changeCount
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
			[' ', 'Change %m.panel color to %m.color', 'panelChange', 'ALL', 'WHITE'],
			[' ', 'Fade %m.panel to %m.color in %n seconds', 'panelFade', 'ALL', 'WHITE', 1],
			[' ', 'Pulse %m.panel to %m.color, changing colors %n times, %n seconds each pulse', 'panelPulse', 'ALL', 'BLUE', 6, 1],
			[
				' ',
				'Flash %m.panel to %m.color, changing colors %n times, %n seconds for new color, %n for old color',
				'panelFlash',
				'ALL',
				'BLUE',
				6,
				1,
				2
			]
		],
		menus: {
			panel: panels,
			color: ['OFF', 'RED', 'GREEN', 'BLUE', 'PURPLE', 'WHITE'],
			minifig: minifigs
		}
	};

	// Register the extension
	ScratchExtensions.register('toypad', descriptor, ext);
})({});
