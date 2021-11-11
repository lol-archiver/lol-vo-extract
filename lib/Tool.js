import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import CRC32 from 'buffer-crc32';
import ZSTD from 'node-zstandard';
import XXHash from 'xxhashjs';

import { dirCache } from './global.js';


export const objSort = function(obj) {
	Object.keys(obj).sort().map(function(key) {
		let val = obj[key];

		delete obj[key];

		obj[key] = val;

		if(val && typeof val == 'object') {
			objSort(val);
		}
	});

	return obj;
};

const pathTempZSTD = resolve(dirCache, 'zstd');

export const unZstd = async function(path, buffer, returnBuffer = false) {
	writeFileSync(pathTempZSTD, buffer);

	await new Promise((resolve, reject) => ZSTD.decompress(pathTempZSTD, path, err => err ? reject(err) : resolve()));

	if(returnBuffer) { return readFileSync(path); }
};

export const toHexL = function(number, pad = 0, reverse = true) {
	const hex = BigInt(number).toString(16).toUpperCase().padStart(pad, '0');

	const hexArr = [];
	for(let i = 0; i < hex.length; i += 2) {
		hexArr.push(hex.slice(i, i + 2));
	}

	return reverse ? hexArr.reverse().join('') : hexArr.join('');
};

export const wadHash = function(str, isHex = false) {
	if(typeof str != 'string') { throw 'argv not String'; }

	const strLower = str.toLowerCase();
	const strBuffer = Buffer.from(strLower);
	const hashBuffer = Buffer.from(XXHash.h64(strBuffer, 0).toString(16).padStart(16,'0').split(/(?<=^(?:.{2})+)(?!$)/).reverse().map(a => Number(`0x${a}`)));
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

export const rstHash = function(str, isHex = false) {
	if(typeof str != 'string') { throw 'argv not String'; }

	const strLower = str.toLowerCase();
	const strBuffer = Buffer.from(strLower);
	// const hashBuffer = XXHash.h64(strBuffer, 0);
	const hashBuffer = Buffer.from(XXHash.h64(strBuffer, 0).toString(16).padStart(16, '0').split(/(?<=^(?:.{2})+)(?!$)/).reverse().map(a => Number(`0x${a}`)));
	const hashHexRaw = hashBuffer.swap64().toString('hex');
	const hashBigInt = BigInt(`0x${hashHexRaw}`) & 0xffffffffffn;

	if(isHex) {
		const hashBigIntSlice = hashBigInt;
		const hashHex = hashBigIntSlice.toString('16').toUpperCase();
		const hashHexPad = hashHex.padStart(10, '0');

		return hashHexPad;
	}

	return hashBigInt;
};

export const crc32 = function(buffer) {
	try {
		return toHexL(CRC32.unsigned(buffer), 8);
	}
	catch(error) {
		return '';
	}
};

export const pad0 = function(id, size = 3) { return String(id).padStart(size, '0'); };