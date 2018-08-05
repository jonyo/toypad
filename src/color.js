let names = {};

class Color {
	constructor (name, code) {
		this.name = name;
		this.code = code;
	}

	static add (name, code) {
		var color = new Color(name, code);
		names[name] = color;
	}
}

Color.add('RED', 0xff0000);
Color.add('GREEN', 0x00ff00);
Color.add('BLUE', 0x0000ff);
Color.add('WHITE', 0xffffff);
Color.add('OFF', 0x000000);

exports.names = names;
exports.Color = Color;
