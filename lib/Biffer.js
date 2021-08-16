import { readFileSync } from 'fs';

import { G } from './global.js';


const sizeDict = {
	s: 1, // vary str

	x: 1, // pad
	c: 1, // char

	b: 1, // signed char
	B: 1, // unsigned char

	h: 2, // signed short
	H: 2, // unsigned short

	i: 4, // signed int
	I: 4, // unsigned int

	l: 4, // signed long
	L: 4, // unsigned long

	q: 8, // signed long
	Q: 8, // unsigned long

	f: 4, // float
	d: 8, // double
};

const parseEndian = function(str) {
	let endian = 'LE';
	let matchEndian = false;

	if(str == '<' || str == '>') {
		endian = str == '<' ? 'LE' : 'BE';

		matchEndian = true;
	}

	return [endian, matchEndian];
};

const parseChar = function(charRaw) {
	let [count, char] = charRaw.split(/(?=[A-Za-z])/);

	if(!char) {
		char = count;

		count = 1;
	}

	return [char, ~~count, sizeDict[char]];
};

const unpack = function(format, buffer, start = 0) {
	const charList = format.match(/(^[<>])|\d*[a-zA-Z]/g);

	const [endian, matchEndian] = parseEndian(charList[0]);

	if(matchEndian) { charList.shift(); }

	const result = [];
	charList.forEach(charRaw => {
		const [char, count, size] = parseChar(charRaw);

		if(char == 's') {
			result.push(
				buffer.toString('utf8', start, start + count)
			);

			start += count;
		}
		else if(char == 'c') {
			let remain = count;

			while(remain-- > 0) {
				result.push(
					String.fromCharCode(buffer[start])
				);
			}

			start += size * count;
		}
		else if(/[bhil]/i.test(char)) {
			const signed = /[bhil]/.test(char) ? '' : 'U';

			let remain = 0;

			do {
				result.push(
					buffer[`read${signed}Int${size * 8}${size > 1 ? endian : ''}`](start + size * remain)
				);
			}
			while(++remain < count);

			start += size * count;
		}
		else if(char == 'Q') {
			let remain = 0;

			do {
				const l = buffer[`readUInt32${endian}`](start + size * remain + (endian == 'LE' ? 0 : 4));
				const h = buffer[`readUInt32${endian}`](start + size * remain + (endian == 'LE' ? 4 : 0));

				result.push(
					(BigInt(h >>> 0) << BigInt(32)) | BigInt(l >>> 0)
				);
			}
			while(++remain < count);

			start += size * count;
		}
		else if(char == 'x') {
			start += size * count;
		}
		else {
			G.warn('Biffer', 'unpack', `unknown format char [${char}]`);
		}
	});

	return result;
};

const calc = function(format) {
	const charList = format.match(/(^[<>])|\d*[a-zA-Z]/g);

	const [, matchEndian] = parseEndian(charList[0]);

	if(matchEndian) { charList.shift(); }

	let length = 0;

	charList.forEach(charRaw => {
		const [char, count] = parseChar(charRaw);

		const len = sizeDict[char];

		if(!len) {
			G.warn('Biffer', 'calc', `unknown format char [${char}]`);
		}
		else {
			length += len * (~~count || 4);
		}
	});

	return length;
};


export default class Biffer {
	constructor(raw) {
		if(raw instanceof Buffer) {
			this.buffer = raw;
		}
		else if(typeof raw == 'string') {
			this.path = raw;

			this.buffer = readFileSync(raw);
		}
		else {
			throw `[Biffer] unknown param ${raw}`;
		}

		this.pos = 0;
		this.length = this.buffer.length;
	}

	unpack(format) {
		const result = unpack(format, this.buffer, this.pos);

		this.pos += calc(format);

		return result;
	}
	tell() {
		return this.pos;
	}
	raw(length) {
		const start = this.pos;
		this.pos += length;

		return this.buffer.slice(start, this.pos);
	}
	sub(length) {
		return new Biffer(this.raw(length));
	}
	seek(position) {
		this.pos = position;
	}
	skip(position) {
		this.pos += position;
	}

	find(from) {
		const buffer = Buffer.from(from);

		const offset = this.buffer.indexOf(buffer, this.pos);

		if(offset > -1) {
			this.pos = offset;

		}

		return offset;
	}
	findFromStart(from) {
		this.seek(0);

		return this.find(from);
	}

	unpackString(format = 'L') {
		const [length] = this.unpack(format);

		const result = this.raw(length);

		return String(result);
	}
	isEnd() {
		return this.pos >= this.buffer.length;
	}
}