import { copyFileSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { ensureDirSync } from 'fs-extra';
import { C, I, dirApp } from '../lib/global.js';
import { pad0 } from '../lib/Tool.js';


const dirFinal = resolve(dirApp, '_final');
const dirTarget = resolve(dirFinal, 'LineAudio');
ensureDirSync(dirTarget);

const idSkin = I.idsSkin[0];

const pathsAudios = [
	resolve(dirFinal, `[${pad0(I.id)}${pad0(I.idsSkin[0])}]${idSkin == 0 ? `${I.champion.title} ${I.champion.name}` : I.champion.skins[idSkin].name}[${I.slot}@${C.server.region}@${C.lang}]`),
];
const pathLine = 'E:/Project/lol-vo-lines-dictation/Evelynn/Coven@zh_cn.md';


const arrAudioFile = pathsAudios.reduce((acc, pathAudios) => { acc.push(...readdirSync(pathAudios).map(name => resolve(pathAudios, name))); return acc; }, []);
const arrLineText = readFileSync(pathLine, 'UTF8').split('\n').filter(text => text.trim());

let curEvent;
let isLineStart = false;

for(const lineText of arrLineText) {
	if(!isLineStart) {
		if(lineText == '## Lines:台词') {
			isLineStart = true;
		}

		continue;
	}

	if(lineText.startsWith('### **')) {
		const [event] = lineText.replace('### ', '').replace('**', '').trim().split(' | ');

		curEvent = event;
	}
	else {
		const [crc32, line] = lineText.replace('- `', '').split('` ');

		const file = arrAudioFile.find(fileName => fileName.includes(crc32));

		if(file) {
			copyFileSync(
				file,
				resolve(dirTarget, `[${curEvent.replace(/:/g, '：').replace(/[*[\]]/g, '')}] ${line.replace(/\*/g, '').replace(/\\n/g, '，').replace(/\//g, '')}(${crc32}).wav`)
			);
		}
		else {
			// eslint-disable-next-line no-console
			console.log('can not match: ', lineText);
		}
	}
}