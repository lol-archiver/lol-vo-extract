import { copyFileSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { emptyDirSync } from 'fs-extra';
import { dirFinal } from '../lib/global.dir.js';
import { C, I } from '../lib/global.js';
import { pad0 } from '../lib/Tool.js';


const dirTarget = resolve(dirFinal, 'LineAudio');
emptyDirSync(dirTarget);

const idSkin = I.idsSkin[0];

const pathsAudios = [
	resolve(dirFinal, `[${pad0(I.id)}${pad0(I.idsSkin[0])}]${idSkin == 0 ? `${I.champion.title} ${I.champion.name}` : I.champion.skins[idSkin].name}[${I.slot}@${C.server.region}@${C.lang}]`),
];
const pathLine = C.path.line;


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
		const [event] = lineText.replace('### ', '').replace(/\*\*/g, '').trim().split(' | ');

		curEvent = event;
	}
	else {
		const [crc32_, line] = lineText.replace('- `', '').split('` ');
		const [crc32] = crc32_.split('|');

		const file = arrAudioFile.find(fileName => fileName.includes(crc32));

		if(file) {
			copyFileSync(
				file,
				resolve(dirTarget, `[${curEvent.replace(/:/g, '：').replace(/[*[\]>]/g, '')}] ${line.replace(/[>]/g, '').replace(/\\n/g, '').replace(/[\\/]/g, '')}(${crc32}).wav`)
			);
		}
		else if(crc32 == '00000000') {
			if(curEvent.includes('选用')) {
				copyFileSync(
					resolve(C.path.dirAutogen, 'reso', 'voice', String(I.champion.id), 'pick.wav'),
					resolve(dirTarget, `[${curEvent.replace(/:/g, '：').replace(/[*[\]>]/g, '')}] ${line.replace(/[>]/g, '').replace(/\\n/g, '').replace(/[\\/]/g, '')}(${crc32}).wav`)
				);
			}
			else if(curEvent.includes('禁用')) {
				copyFileSync(
					resolve(C.path.dirAutogen, 'reso', 'voice', String(I.champion.id), 'ban.wav'),
					resolve(dirTarget, `[${curEvent.replace(/:/g, '：').replace(/[*[\]>]/g, '')}] ${line.replace(/[>]/g, '').replace(/\\n/g, '').replace(/[\\/]/g, '')}(${crc32}).wav`)
				);
			}
		}
		else {
			// eslint-disable-next-line no-console
			console.log('can not match: ', lineText);
		}
	}
}
