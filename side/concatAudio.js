import { readdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { ensureDirSync } from 'fs-extra';
import Iconv from 'iconv-lite';
import { dirApp } from '../lib/globalDir.js';


const dirFinal = resolve(dirApp, '_final');
const dirCWD = resolve(dirFinal, 'Audio2Text');
const dirAudio = resolve(dirCWD, 'audio');
const dirText = resolve(dirCWD, 'text');
ensureDirSync(dirAudio);
ensureDirSync(dirText);


const dirSource = resolve(dirFinal, '[028024]魔女 伊芙琳[Evelynn@PBE1@zh_cn]');
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

writeFileSync(resolve(dirCWD, 'concatAudio.bat'), Iconv.encode(cmds.join('\r\n'), 'GB2312'));