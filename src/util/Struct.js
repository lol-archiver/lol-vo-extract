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

module.exports = {
	unpack(format, buffer, start = 0) {
		let charList = format.match(/(^[<>])|\d*[a-zA-Z]/g);

		let [endian, matchEndian] = parseEndian(charList[0]);

		if(matchEndian) { charList.shift(); }

		let result = [];
		charList.forEach(charRaw => {
			let [char, count, size] = parseChar(charRaw);

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
				let signed = /[bhil]/.test(char) ? '' : 'U';

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
					let l = buffer[`readUInt32${endian}`](start + size * remain + (endian == 'LE' ? 0 : 4));
					let h = buffer[`readUInt32${endian}`](start + size * remain + (endian == 'LE' ? 4 : 0));

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
				L(`警告，Struct.unpack 发现不支持的字符 ${char}`);
				debugger;
			}
		});

		return result;
	},

	calc(format) {
		let charList = format.match(/(^[<>])|\d*[a-zA-Z]/g);

		let [, matchEndian] = parseEndian(charList[0]);

		if(matchEndian) { charList.shift(); }

		let length = 0;

		charList.forEach(charRaw => {
			let [char, count] = parseChar(charRaw);

			let len = sizeDict[char];

			if(!len) {
				L(`警告，Struct.calc 发现不支持的字符 ${char}`);
			}
			else {
				length += len * (~~count || 4);
			}
		});

		return length;
	}
};
