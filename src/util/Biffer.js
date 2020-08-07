const Struct = require('./Struct');

module.exports = class Biffer {
	constructor(raw) {
		if(raw instanceof Buffer) {
			this.buffer = raw;
		}
		else if(typeof raw == 'string') {
			this.path = raw;

			this.buffer = _fs.readFileSync(raw);
		}
		else {
			throw `[Biffer] unknown param ${raw}`;
		}

		this.pos = 0;
		this.length = this.buffer.length;

		this.unpack = function(format) {
			let result = Struct.unpack(format, this.buffer, this.pos);

			this.pos += Struct.calc(format);

			return result;
		};
		this.tell = function() {
			return this.pos;
		};
		this.raw = function(length) {
			let start = this.pos;
			this.pos += length;

			return this.buffer.slice(start, this.pos);
		};
		this.sub = function(length) {
			return new Biffer(this.raw(length));
		};
		this.seek = function(position) {
			this.pos = position;
		};
		this.skip = function(position) {
			this.pos += position;
		};

		this.find = function(from) {
			const buffer = Buffer.from(from);

			const offset = this.buffer.indexOf(buffer, this.pos);

			if(offset > -1) {
				this.pos = offset;

			}

			return offset;
		};
		this.findFromStart = function(from) {
			this.seek(0);

			return this.find(from);
		};

		this.unpackString = function(format = 'L') {
			let [length] = this.unpack(format);

			let result = this.raw(length);

			return String(result);
		};
		this.isEnd = function() {
			return this.pos >= this.buffer.length;
		};
	}
};