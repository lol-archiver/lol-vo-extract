import '../index.env.js';

import { copyFileSync, readdirSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { emptyDirSync, ensureDirSync } from 'fs-extra';
import Iconv from 'iconv-lite';

import { C } from '@nuogz/pangu';

import { dirFinal, dirTextAudio } from '../lib/dir.js';
import { pad0 } from '../lib/utility.js';
import { I } from '../lib/info.js';
import { spawnSync } from 'child_process';



const dirCWD = resolve(dirTextAudio);
const dirAudio = resolve(dirCWD, 'audio');
const dirAudioSingle = resolve(dirCWD, 'audio-single');
const dirText = resolve(dirCWD, 'text');

ensureDirSync(dirAudio);
ensureDirSync(dirAudioSingle);
ensureDirSync(dirText);

emptyDirSync(dirAudio);
emptyDirSync(dirAudioSingle);
emptyDirSync(dirText);


const idSkin = I.idsSkin[0];
const dirSource = resolve(dirFinal, `[${pad0(I.id)}${pad0(idSkin)}]${idSkin == 0 ? `${I.champion.title} ${I.champion.name}` : I.champion.skins[idSkin].name}[${I.slot}@${C.server.region}@${C.lang}]`);
const files = readdirSync(dirSource);

const dicts = {};

files.forEach(f => {
	const event = f.split('[')[0];

	(dicts[event] || (dicts[event] = [])).push(f);
});

const cmds = ['@echo off', dirAudioSingle.substr(0, 2), `cd "${dirAudioSingle}"`];


const mapsFile = [];

Object.entries(dicts).forEach(([event, filesInput], indexDict) => {
	const passes = ['ffmpeg'];

	filesInput.forEach((file, indexFile) => {
		const fileCopy = `${String(indexDict).padStart(3, '0')}-${String(indexFile).padStart(2, '0')}${parse(file).ext}`;

		copyFileSync(resolve(dirSource, file), resolve(dirAudioSingle, fileCopy));

		passes.push('-i', `"${fileCopy}"`);

		const textMap = `${fileCopy}|${file}`;

		mapsFile.push(textMap);

		// globalThis.console.log(textMap);
	});

	passes.push(
		'-filter_complex',
		`"${filesInput.map((f, i) => `[${i}:0]`).join('')}concat=n=${filesInput.length}:v=0:a=1[out]"`,
		'-map',
		'"[out]"',
		`%~dp0audio/j${String(indexDict).padStart(2, '0')}.mp3`,
		// `%~dp0audio/${event.replace(/&/g, '')}.mp3`,
	);

	cmds.push(passes.join(' '));
});

cmds.push('pause');

writeFileSync(resolve(dirAudioSingle, '@map.txt'), mapsFile.join('\n'));
writeFileSync(resolve(dirCWD, 'concat-audio.bat'), Iconv.encode(cmds.join('\r\n'), 'GBK'));


const { status, error, stderr, stdout } = spawnSync(resolve(dirCWD, 'concat-audio.bat'), []);
if(status != 0) { throw (error && error.message) || (stderr && stderr.toString()); }

process.stdout.write(Iconv.decode(stdout, 'GBK'));

spawnSync('explorer', [dirAudio]);
