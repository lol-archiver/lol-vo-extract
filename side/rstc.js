import assert from 'assert';

import { readFileSync, writeFileSync } from 'fs';
import Biffer from '../lib/Biffer.js';

import { G } from '../lib/global.js';
import { rstHash } from '../lib/Tool.js';



const pathFile = 'D:/Desk/fontconfig_zh_cn.txt';

const hashes = readFileSync('data/texts.rst.txt', 'utf8').split('\n')
	.reduce((r, str) => ((r[rstHash(str, true)] = str) && 0) || r, {});

const biffer = new Biffer(pathFile);

const [magic, versionMajor, versionMinor] = biffer.unpack('<3sBB');

if(magic != 'RST') {
	throw `Invalid magic code: ${magic}`;
}
if(!['2.0', '2.1'].includes(`${versionMajor}.${versionMinor}`)) {
	throw `Unsupported RST version: ${versionMajor}.${versionMinor}`;
}

const rst = {};

if(versionMinor == 1) {
	rst.font_config = biffer.unpackString();
}
else {
	rst.font_config = null;
}

const [count] = biffer.unpack('<L');
const entries = [];

for(let i = 0; i < count; i++) {
	const [v] = biffer.unpack('<Q');
	entries.push([v >> 40n, v & 0xffffffffffn]);
}

assert(biffer.raw(1)[0] == versionMinor);

const bifferText = biffer.sub(biffer.length);

for(const entry of entries) {
	if(entry[0] > Number.MAX_SAFE_INTEGER) {
		throw 'Over MAX_SAFE_INTEGER';
	}

	const start = Number(entry[0]);

	bifferText.seek(start);
	const end = bifferText.find([0]);
	bifferText.seek(start);

	const bufferSub = bifferText.raw(end - start);

	const text = hashes[entry[1].toString(16).toUpperCase()];

	entry[0] = text || entry[1];

	if(bufferSub[0] == 195 && bufferSub[0] == 191) {
		G.info('wait');
	}
	else {
		entry[1] = `"${bufferSub.toString('utf8')}"`;
	}
}

writeFileSync(pathFile + '.un.txt', entries.map(e => e.join(' = ')).sort().join('\n'));
