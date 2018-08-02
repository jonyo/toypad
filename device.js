module.exports = (function () {
	var EventEmitter = require('events').EventEmitter,
		util = require('util'),
		HID = require('node-hid'),
		minifig = require('./minifig.js'),
		action = require('./action.js'),
		panel = require('./panel.js'),
		PRODUCT_ID_ = 0x0241,
		VENDOR_ID_ = 0x0e6f;

	var device = function() {
		EventEmitter.call(this);
		this.hidDevice_ = null;
		this.colourUpdateNumber_ = 0;
	};

	util.inherits(device, EventEmitter);

	device.prototype.connect = function() {
		this.hidDevice_ = new HID.HID(VENDOR_ID_, PRODUCT_ID_);

		this.hidDevice_.on('data', function(data) {
			var cmd = data[1];
			if (cmd == 0x0b) {
				// minifg scanned
				var panel = panel.byCode(data[2]);
				var action = action.byCode(data[5]);
				var signature = getHexSignature_(data.slice(7, 13));
				this.emit('minifig-scan', {
					'panel': panel,
					'action': action,
					'minifig': minifig.byId(signature),
					'id': signature
				});
			} else if (cmd == 0x01) {
				// LED change

			} else if (cmd == 0x19) {
				// connected
				this.emit('connected');
			} else {
				console.log('unknown toypad command', data);
			}
		}.bind(this));

		this.hidDevice_.on('error', function(error) {
			this.emit('error', error);
		}.bind(this));

		this.hidDevice_.write([0x00,
			0x55, 0x0f, 0xb0, 0x01,
			0x28, 0x63, 0x29, 0x20,
			0x4c, 0x45, 0x47, 0x4f,
			0x20, 0x32, 0x30, 0x31,
			0x34, 0xf7, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00]);
	};

	device.prototype.checksum = function(data) {
		var checksum = 0;
		for (var i = 0; i < data.length; i++) {
			checksum += data[i];
		}
		data.push(checksum & 0xFF);
		return data;
	};

	device.prototype.pad = function(data) {
		while(data.length < 32) {
			data.push(0x00);
		}
		return data;
	};

	device.prototype.write = function(data) {
		this.hidDevice_.write([0x00].concat(this.pad(this.checksum(data))));
	};

	device.prototype.updatePanel = function(panel, color, opt_speed) {
		if (typeof opt_speed !== 'number') {
			opt_speed = 0.7;
		}
		var data = [
		this.colourUpdateNumber_ & 0xFF,
		panel.code,
		((1 - opt_speed) * 0xFF) & 0xFF,
		0x01, (color >> 16) & 0xFF,
		(color >> 8) & 0xFF,
		color & 0xFF
		];

		this.colourUpdateNumber_++;
		this.write([0x55, 0x08, 0xc2].concat(data));
	};
	return device;
})();
