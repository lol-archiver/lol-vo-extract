import AS from 'assert';
import { readFileSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { dirData } from '../lib/global.dir.js';
import { C, G } from '../lib/global.js';
import Biffer from '@nuogz/biffer';


const hashes = readFileSync(resolve(dirData, 'hashes.rst.txt'), 'utf8').split('\n').map(line => line.split(' '))
	.reduce((r, [strHash, text]) => ((r[strHash] = text) && 0) || r, {});


const biffer = new Biffer(C.path.rst);


const [magic, versionMajor] = biffer.unpack('<3sB');
AS(magic == 'RST', `Invalid magic code: ${magic}`);
AS(2 <= versionMajor && versionMajor <= 5, `Unsupported RST version: ${versionMajor}`);


let configFont;
let bitHash = 40n;
let maskHash = (1n << bitHash) - 1n;


let versionMinor;
if(versionMajor == 2 && (versionMinor = biffer.unpack('B')[0])) {
	// eslint-disable-next-line no-unused-vars
	configFont = biffer.unpackString();
}
else if([4, 5].includes(versionMajor)) {
	bitHash = 39n;
	maskHash = (1n << bitHash) - 1n;
}


const [count] = biffer.unpack('<L');
const entries = [];

for(let i = 0; i < count; i++) {
	const [v] = biffer.unpack('<Q');
	entries.push({
		pos: v >> bitHash,
		hash: v & maskHash,
		text: null,
		content: null,
	});
}

if(versionMajor < 5) {
	AS(biffer.slice(1)[0] == versionMinor);
}

const bifferEntries = biffer.sub(biffer.length);

for(const entry of entries) {
	AS(entry.pos <= Number.MAX_SAFE_INTEGER, 'Over MAX_SAFE_INTEGER');


	const posLeft = Number(entry.pos);

	bifferEntries.seek(posLeft);
	const posRight = bifferEntries.find([0]);

	bifferEntries.seek(posLeft);
	const bufferText = bifferEntries.slice(posRight - posLeft);


	if(bufferText[0] == 195 && bufferText[0] == 191) { G.info('wait'); }


	entry.text = hashes[entry.hash.toString(16).toUpperCase().padStart(10, '0')];
	entry.content = bufferText.toString('utf8');
}

const fileRST = parse(C.path.rst);
writeFileSync(resolve(fileRST.dir, `${fileRST.name}.match${fileRST.ext}`), entries.filter(e => e.text).map(e => `${e.text} = ${e.content}`).sort().join('\n'));
writeFileSync(resolve(fileRST.dir, `${fileRST.name}.unmatch${fileRST.ext}`), entries.filter(e => !e.text).map(e => `${e.hash} = ${e.content}`).join('\n'));