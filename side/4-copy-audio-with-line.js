import '../index.env.js';
import { C } from '@nuogz/pangu';

import { copyFileSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import Filenamify from 'filenamify';
import { emptyDirSync } from 'fs-extra/esm';

import { dirFinal, dirTextAudio } from '../lib/dir.js';

import { I } from '../lib/info.js';



// const safeFileName = name => name.replace(/:/g, '：').replace(/<(.*?)>/g, '（$1）').replace(/["*[\]<>\\/]|\\n/g, '');


const dirTarget = resolve(dirTextAudio, '@line-audio');
emptyDirSync(dirTarget);


const idFull = I.id0Full;
const region = (!C.saveWithShort ? C.server.region : C.server.region.replace(/\d+$/, '')).toLowerCase();

const idMatch = `${idFull}@`;
const regionMatch = `@${region}`;
const langMatch = `@${C.lang.split('_')[0]}`;


const fileLine = readdirSync(resolve(C.path.dirLines, 'dictation')).find(dirent => dirent.startsWith(idMatch) && !dirent.includes('.bak.'));
const dirsAudio = [
	resolve(dirFinal, readdirSync(resolve(dirFinal)).find(dirent => dirent.startsWith(idMatch) && dirent.includes(regionMatch) && dirent.includes(langMatch))),
];


const filesAudio = dirsAudio.map(dirAudio => readdirSync(dirAudio).map(file => resolve(dirAudio, file))).flat();
const textsLine = readFileSync(resolve(C.path.dirLines, 'dictation', fileLine), 'utf-8').split('\n').filter(text => text.trim());


let eventNow;
let startedLine = false;
for(const textLine of textsLine) {
	if(!startedLine) {
		if(textLine == '## Lines:台词') { startedLine = true; }

		continue;
	}

	if(textLine.startsWith('<!--')) { continue; }


	if(textLine.startsWith('### **')) {
		[eventNow] = textLine.replace('### ', '').replace(/\*\*/g, '').trim().split(' | ');
	}
	else {
		const [, rawMeta, line] = textLine.match(/^- `(.*?)(?<!\\)` (.*)$/) ?? [];
		const [idSound, /* idAudio */, ...rawExtras] = rawMeta.trim().split(/(?<!\\)\|/);
		const extras = rawExtras.map(raw => {
			const [type, rawParams = ''] = raw.split(/(?<!\\):/);

			return { type, params: rawParams.split(/(?<!\\),/) };
		});
		if(extras.find(e => e.type == 'ignore')) { continue; }



		let fileSource;
		const fileAudio = filesAudio.find(fileName => fileName.includes(`[${idSound}]`));

		if(fileAudio) { fileSource = fileAudio; }
		else if(idSound == '00000000' || idSound == '00000001') {
			if(eventNow.includes('[选用]')) {
				fileSource = resolve(C.path.dirAutogen, 'reso', 'voice', String(I.champion.id), 'pick.wav');
			}
			else if(eventNow.includes('[禁用]')) {
				fileSource = resolve(C.path.dirAutogen, 'reso', 'voice', String(I.champion.id), 'ban.wav');
			}
		}
		else {
			globalThis.console.warn('unmatch: ', eventNow, line);
		}


		if(fileSource) {
			copyFileSync(
				fileSource,
				resolve(dirTarget, Filenamify(`${eventNow} ${line}(${idSound}).wav`))
			);
		}
	}
}
