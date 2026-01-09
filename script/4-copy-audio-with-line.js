import '@nuogz/pangu/index.js?i18n&config&day&log=copy-audio-with-line&log.willOutputConsoleError=true';
import { C, G, dirWorking } from '@nuogz/pangu';

import { spawnSync } from 'child_process';
import { copyFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import Filenamify from 'filenamify';
import { emptyDirSync } from 'fs-extra/esm';

import { T, TS } from '../lib/i18n.js';

import parseRuncom from '../src/parse-runcom.js';
import { pad0 } from '../lib/utility.js';
import parseExtractConfig from '../src/parse-extract-config.js';

const GG = G.where(T('where:main'));



/** @param {import('../bases.d.ts').ExtractConfig} E */
const copyAudioWithLine = E => {
	const dirTarget = resolve(dirWorking, '@3side', '@line-audio');
	emptyDirSync(dirTarget);

	const region = (!E.saveWithShort ? E.regionCDN : E.regionCDN.replace(/\d+$/, '')).toLowerCase();

	const slotMatch = E.mode == 'skin' ? `${pad0(E.champion.id)}${pad0(E.skin.id)}@` : `${E.slot}@`;
	const regionMatch = E.mode == 'skin' ? `@${region}` : '';
	const langMatch = `@${E.lang.split('_')[0]}`;


	const fileLine = readdirSync(E.dirDictations).find(dirent => dirent.includes(slotMatch) && !dirent.includes('.bak.'));
	const dirsAudio = [resolve(E.dirExportVoice,
		readdirSync(resolve(E.dirExportVoice)).find(dirent =>
			dirent.startsWith(slotMatch) &&
			dirent.includes(regionMatch) &&
			dirent.includes(langMatch))),
	];


	const filesAudio = dirsAudio.map(dirAudio => readdirSync(dirAudio).map(file => resolve(dirAudio, file))).flat();
	const textsLine = readFileSync(resolve(E.dirDictations, fileLine), 'utf-8').split('\n').filter(text => text.trim());


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
			if(extras.find(e => e.type == 'skip')) { continue; }


			let condNow = '';
			let condExtra = extras.find(e => e.type == 'cond');
			if(condExtra) {
				condNow = condExtra.params[0];
			}

			const idSoundFirst = idSound.split('.')[0];

			let fileSource;
			const fileAudio = filesAudio.find(fileName => fileName.includes(`${idSoundFirst}`));

			if(fileAudio) { fileSource = fileAudio; }
			else if(idSoundFirst == '00000000' || idSoundFirst == '00000001') {
				if(eventNow.includes('[选用]')) {
					fileSource = resolve(E.dirAutogen, 'resource', 'project', `${String(E.champion.id).padStart(3, '0')}-${E.champion.slot.toLowerCase()}`, 'voice-pick.wav');
				}
				else if(eventNow.includes('[禁用]')) {
					fileSource = resolve(E.dirAutogen, 'resource', 'project', `${String(E.champion.id).padStart(3, '0')}-${E.champion.slot.toLowerCase()}`, 'voice-ban.wav');
				}
			}
			else {
				globalThis.console.warn('unmatch: ', eventNow + condNow, line);
			}


			if(existsSync(fileSource)) {
				copyFileSync(
					fileSource,
					resolve(dirTarget, Filenamify(`${eventNow}${condNow ? `[子条件：${condNow}]` : ''} ${line.replace(/\\/g, '')}(${idSoundFirst}).wav`))
				);
			}
			else {
				globalThis.console.warn('source file not found: ', eventNow + condNow, line);
			}
		}
	}



	spawnSync('explorer', [dirTarget]);
};



try {
	const runcoms = parseRuncom(C.runcom);
	const configsExtract = parseExtractConfig(runcoms);
	const configExtract = configsExtract[0];


	if(configExtract.mode == 'skin') {
		GG.info(...TS('execute-config', { config: configExtract }, 'info-skin'));
	}
	else {
		GG.info(...TS('execute-config', { config: configExtract }, 'info-specify'));
	}


	await copyAudioWithLine(configExtract);
}
catch(error) {
	GG.error('复制[语音]', error);
}
