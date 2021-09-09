import { readdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { emptyDirSync, ensureDirSync } from 'fs-extra';
import Iconv from 'iconv-lite';
import { C, I, dirApp } from '../lib/global.js';
import { pad0 } from '../lib/Tool.js';


const dirFinal = resolve(dirApp, '_final');
const dirCWD = resolve(dirFinal, 'Audio2Text');
const dirAudio = resolve(dirCWD, 'audio');
const dirText = resolve(dirCWD, 'text');
emptyDirSync(dirAudio);
ensureDirSync(dirText);

const idSkin = I.idsSkin[0];
const dirSource = resolve(dirFinal, `[${pad0(I.id)}${pad0(idSkin)}]${idSkin == 0 ? `${I.champion.title} ${I.champion.name}` : I.champion.skins[idSkin].name}[${I.slot}@${C.server.region}@${C.lang}]`);
const files = readdirSync(dirSource);

const dicts = {};

files.forEach(f => {
	const event = f.split('[')[0];

	(dicts[event] || (dicts[event] = [])).push(f);
});

const cmds = ['@echo off', dirSource.substr(0, 2), `cd "${dirSource}"`];

Object.entries(dicts).forEach(([event, inputs]) => {
	const passes = ['ffmpeg'];

	inputs.forEach(f => passes.push('-i', `"${f}"`));

	passes.push(
		'-filter_complex',
		`"${inputs.map((f, i) => `[${i}:0]`).join('')}concat=n=${inputs.length}:v=0:a=1[out]"`,
		'-map',
		'"[out]"',
		`%~dp0audio/${event.replace(/&/g, '')}.mp3`,
	);

	cmds.push(passes.join(' '));
});

cmds.push('pause');

writeFileSync(resolve(dirCWD, 'concatAudio.bat'), Iconv.encode(cmds.join('\r\n'), 'GBK'));