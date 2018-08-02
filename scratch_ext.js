new (function() {
	var device = null;
	var input = null;
	var poller = null;
	var ext = this;
	var debug = true;
	var speeds = {
		SLOW: 1.0,
		MEDIUM: 0.5,
		FAST: 0.1
	};
	var colors = {
		RED: 0xff0000,
		GREEN: 0x00ff00,
		BLUE: 0x0000ff,
		PURPLE: 0xff00ff,
		OFF: 0x000000,
		WHITE: 0xffffff
	};
	var panels = {};

	this.colourUpdateNumber_ = 0;

	ext._deviceConnected = function(dev) {
		if (device) {
			return;
		}

		device = dev;
		device.open();

		poller = setInterval(
			function() {
				input = device.read();
			},
			20
		);

		device.write([0x00,
			0x55, 0x0f, 0xb0, 0x01,
			0x28, 0x63, 0x29, 0x20,
			0x4c, 0x45, 0x47, 0x4f,
			0x20, 0x32, 0x30, 0x31,
			0x34, 0xf7, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00]);

		if (debug) {
			setInterval(
				function() {
					console.log(input);
				},
				100
			);
		}
	};

	ext._deviceRemoved = function(dev) {
		if (device != dev){
			return;
		}
		device = null;
		stopPolling();
	};

	function stopPolling() {
		if (poller) {
			clearInterval(poller);
		}
		poller = null;
	}

	var pad = function pad(data) {
		while(data.length < 32) {
			data.push(0x00);
		}
		return data;
	}

	var checksum = function checksum(data) {
		var checksum = 0;
		for (var i = 0; i < data.length; i++) {
			checksum += data[i];
		}
		data.push(checksum & 0xFF);
		return data;
	};

	function write(data) {
		if (!device) {
			return;
		}
		device.write([0x00].concat(pad(checksum(data))))
	}

	ext._shutdown = function() {
		if (poller) {
			clearInterval(poller);
		}
		poller = null;

		if (device) {
			device.close();
		}
		device = null;
	}

	ext._getStatus = function() {
		if (!device) {
			return {
				status: 1, msg: 'Gamepad disconnected'
			};
		}
		return {
			status: 2, msg: 'Gamepad connected'
		};
	}

	ext.updatePanel = function(panel, color, speed) {
		console.log('updatePanel');
		if (!device) {
			console.log('No device connected!');
			return;
		}
		speed = speeds[speed];
		color = colors[color];
		panel = panels[panel];
		console.log(speed, color, panel);
		var data = [
			this.colourUpdateNumber_ & 0xFF,
			panel,
			((1 - speed) * 0xFF) & 0xFF,
			0x01,
			(color >> 16) & 0xFF,
			(color >> 8) & 0xFF,
			color & 0xFF
		];

		this.colourUpdateNumber_++;
		write([0x55, 0x08, 0xc2].concat(data));
	}.bind(ext);

	var descriptor = {
		blocks: [
			['w', 'set %m.panel color to %m.color %m.speed', 'updatePanel', 'ALL', 'OFF', 'SLOW']
		],
		menus: {
			panel: ['ALL', 'LEFT', 'RIGHT', 'CENTER'],
			color: ['OFF', 'RED', 'GREEN', 'BLUE', 'PURPLE', 'WHITE'],
			speed: ['SLOW', 'MEDIUM', 'FAST']
		}
	};
	ScratchExtensions.register('Toypad', descriptor, ext, {type: 'hid', vendor:0x054c, product:0x0268});
})();
