(function (ext) {
	var socket = null;

	var connected = false;

	var panels = {};

	var speeds = {
		SLOW: 1.0,
		MEDIUM: 0.5,
		FAST: 0.1
	};

	ext.cnct = function (callback) {
		console.log('connecting...');
		window.socket = new WebSocket("ws://127.0.0.1:8080");
		window.socket.onopen = function () {
			// give the connection time establish
			window.setTimeout(function() {
				callback();
			}, 1000);
		};

		window.socket.onmessage = function (message) {
			console.log('onmessage');
			var msg = JSON.parse(message.data);
			console.log(msg);
			return;

			// handle the only reporter message from the server
			// for changes in digital input state
			var reporter = msg['report'];
			if(reporter === 'digital_input_change') {
				var pin = msg['pin'];
				digital_inputs[parseInt(pin)] = msg['level']
			}
			console.log(message.data)
		};
		window.socket.onclose = function (e) {
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
		window.socket.send(msg);
	};

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	ext._getStatus = function (status, msg) {
		return {status: myStatus, msg: myMsg};
	};

	// when the connect to server block is executed
	ext.input = function (pin) {
		console.log('input');
		return;
		if (connected == false) {
			alert("Server Not Connected");
		}
		// validate the pin number for the mode
		if (validatePin(pin)) {
			var msg = JSON.stringify({
				"command": 'input', 'pin': pin
			});
			window.socket.send(msg);
		}
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
		window.socket.send(JSON.stringify(msg));
	}.bind(ext);

	// Block and block menu descriptions
	var descriptor = {
		blocks: [
			["w", 'Connect to the toypad.', 'cnct'],
			['w', 'set %m.panel color to %m.color %m.speed', 'updatePanel', 'ALL', 'OFF', 'SLOW']
		],
		menus: {
			panel: ['ALL', 'LEFT', 'RIGHT', 'CENTER'],
			color: ['OFF', 'RED', 'GREEN', 'BLUE', 'PURPLE', 'WHITE'],
			speed: ['SLOW', 'MEDIUM', 'FAST']
		}
	};

	// Register the extension
	ScratchExtensions.register('toypad', descriptor, ext);
})({});
