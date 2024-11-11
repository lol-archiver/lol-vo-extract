import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

import CRC32 from 'buffer-crc32';
import XXHash from 'xxhashjs';

import { TS } from './i18n.js';



export const unzstd = (buffer, file, fileZSTD, returnBuffer = true) => {
	const result = spawnSync(fileZSTD, ['-d'], {
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
export const toHexL8 = (number, reverse = true) => { return toHexL(number, 8, reverse); };
export const showID = number => { return `${String(number).padStart(10, ' ')}|${toHexL8(number)}`; };


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
		return toHexL8(CRC32.unsigned(buffer));
	}
	catch {
		return '';
	}
};


/** default size is `3` */
export const pad0 = (id, size = 3) => String(id).padStart(size, '0');


export const toBufferHex = buffer => [...(buffer.target ?? buffer)].map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');


/**
 * @param {string} what
 * @param {...string} infos
 * @returns {Error}
 */
export const LogError = (what, ...infos) => {
	const error = Error(infos.length ? [what, infos.join(' ')].join('  ') : what);

	error.what = what;
	error.infos = infos;
	error.stack = error.stack.replace(/^.*?at LogError \(.*?$\n/m, '').replace(/^.*?at TLogError \(.*?$\n/m, '');


	return error;
};
/** @type {import('../bases.d.ts').TranslatorLogErrorHandle} */
export const TLogError = function() { return LogError(...TS(...arguments)); };


/**
 * @param {Error} cause
 * @param {string} what
 * @param {...string} infos
 * @returns {Error}
 */
export const StackError = (cause, what = '✖', ...infos) => {
	const error = Error(infos.length ? [what, infos.join(' ')].join('  ') : what, { cause });

	error.what = what;
	error.infos = infos;
	error.stack = error.stack.replace(/^.*?at StackError \(.*?$\n/m, '');


	return error;
};
