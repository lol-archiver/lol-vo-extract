import '../index.env.js';
import { C } from '@nuogz/pangu';

import { copyFileSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import Filenamify from 'filenamify';
import { emptyDirSync } from 'fs-extra';

import { dirFinal, dirTextAudio } from '../lib/dir.js';

import { I } from '../lib/info.js';



// const safeFileName = name => name.replace(/:/g, '：').replace(/<(.*?)>/g, '（$1）').replace(/["*[\]<>\\/]|\\n/g, '');


const dirTarget = resolve(dirTextAudio, '@line-audio');
emptyDirSync(dirTarget);


const idFull = I.id0Full;
const region = (!C.saveWithShort ? C.server.region : C.server.region.replace(/\d+$/, '')).toLowerCase();

const idMatch = `${idFull}@`;
const regionMatch = `@${region}`;


const fileLine = readdirSync(resolve(C.path.dirLines, 'dication')).find(dirent => dirent.startsWith(idMatch));
const dirsAudio = [
	resolve(dirFinal, readdirSync(resolve(dirFinal)).find(dirent => dirent.startsWith(idMatch) && dirent.includes(regionMatch))),
];


const filesAudio = dirsAudio.map(dirAudio => readdirSync(dirAudio).map(file => resolve(dirAudio, file))).flat();
const textsLine = readFileSync(fileLine, 'utf-8').split('\n').filter(text => text.trim());


let eventNow;
let startedLine = false;
for(const textLine of textsLine) {
	if(!startedLine) {
		if(textLine == '## Lines:台词') { startedLine = true; }

		continue;
	}


	if(textLine.startsWith('### **')) {
		[eventNow] = textLine.replace('### ', '').replace(/\*\*/g, '').trim().split(' | ');
	}
	else {
		const [ids, line] = textLine.replace('- `', '').split('` ');
		const [idSound] = ids.split('|');


		let fileSource;
		const fileAudio = filesAudio.find(fileName => fileName.includes(`[${idSound}]`));

		if(fileAudio) { fileSource = fileAudio; }
		else if(idSound == '00000000' || idSound == '00000001') {
			if(eventNow == '选用') {
				fileSource = resolve(C.path.dirAutogen, 'reso', 'voice', String(I.champion.id), 'pick.wav');
			}
			else if(eventNow == '禁用') {
				fileSource = resolve(C.path.dirAutogen, 'reso', 'voice', String(I.champion.id), 'ban.wav');
			}
		}
		else {
			globalThis.console.warn('unmatch: ', eventNow, line);
		}


		if(fileSource) {
			copyFileSync(
				fileSource,
				resolve(dirTarget, Filenamify(`[${eventNow}] ${line}(${idSound}).wav`))
			);
		}
	}
}
