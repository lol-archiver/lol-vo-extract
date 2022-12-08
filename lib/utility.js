import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

import CRC32 from 'buffer-crc32';
import XXHash from 'xxhashjs';

import { C } from '@nuogz/pangu';



export const unzstd = (buffer, file, returnBuffer = true) => {
	const result = spawnSync(C.path.zstd, ['-d'], {
		input: buffer,
		maxBuffer: buffer.length * 10,
		stdio: ['pipe', returnBuffer ? 'pipe' : 'ignore', 'pipe']
	});

	if(result.error || result.stderr.length) { throw Error(result.error || result.stderr.toString()); }

	if(file) { writeFileSync(file, result.stdout); }

	return result.stdout;
};


export const toHexL = (number, pad = 0, reverse = true) => {
	const hex = BigInt(number).toString(16).toUpperCase().padStart(pad, '0');

	const hexArr = [];
	for(let i = 0; i < hex.length; i += 2) {
		hexArr.push(hex.slice(i, i + 2));
	}

	return reverse ? hexArr.reverse().join('') : hexArr.join('');
};


export const wadHash = (str, isHex = false) => {
	if(typeof str != 'string') { throw 'argv not String'; }

	const strLower = str.toLowerCase();
	const strBuffer = Buffer.from(strLower);
	const hashBuffer = Buffer.from(XXHash.h64(strBuffer, 0).toString(16).padStart(16, '0').split(/(?<=^(?:.{2})+)(?!$)/).reverse().map(a => Number(`0x${a}`)));
	const hashHexRaw = hashBuffer.swap64().toString('hex');
	const hashBigInt = BigInt(`0x${hashHexRaw}`);

	if(isHex) {
		const hashBigIntSlice = hashBigInt;
		const hashHex = hashBigIntSlice.toString('16').toUpperCase();
		const hashHexPad = hashHex.padStart(10, '0');

		return hashHexPad;
	}

	return hashBigInt;
};


export const rstHash = (str, isHex = false, bits = 40) => {
	if(typeof str != 'string') { throw 'argv not String'; }

	const strLower = str.toLowerCase();
	const strBuffer = Buffer.from(strLower);
	const hashBuffer = Buffer.from(XXHash.h64(strBuffer, 0).toString(16).padStart(16, '0').split(/(?<=^(?:.{2})+)(?!$)/).reverse().map(a => Number(`0x${a}`)));
	const hashHexRaw = hashBuffer.swap64().toString('hex');
	const hashBigInt = BigInt(`0x${hashHexRaw}`) & ((1n << BigInt(bits)) - 1n);

	if(isHex) {
		const hashBigIntSlice = hashBigInt;
		const hashHex = hashBigIntSlice.toString('16').toUpperCase();
		const hashHexPad = hashHex.padStart(10, '0');

		return hashHexPad;
	}

	return hashBigInt;
};


export const crc32 = buffer => {
	try {
		return toHexL(CRC32.unsigned(buffer), 8);
	}
	catch(error) {
		return '';
	}
};


export const pad0 = (id, size = 3) => String(id).padStart(size, '0');
