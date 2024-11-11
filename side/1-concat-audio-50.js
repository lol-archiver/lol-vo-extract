import '@nuogz/pangu/index.js?i18n&config&day&log=concat-audio-50&log.willOutputConsoleError=true&day';
import { C, G, dirWorking } from '@nuogz/pangu';

import { spawnSync } from 'child_process';
import { copyFileSync, readdirSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { emptyDirSync } from 'fs-extra/esm';
import Iconv from 'iconv-lite';

import { T, TS } from '../lib/i18n.js';

import parseRuncom from '../src/parse-runcom.js';
import parseExtractConfig from '../src/parse-extract-config.js';



const GG = G.where(T('where:main'));

/** @param {import('../bases.d.ts').ExtractConfig} E */
const concatAudioEvery50 = E => {
	const dirSideData = resolve(dirWorking, '@3side');

	const dirAudioConcat = resolve(dirSideData, 'audio-concat');
	emptyDirSync(dirAudioConcat);
	const dirAudioSingle = resolve(dirSideData, 'audio-single');
	emptyDirSync(dirAudioSingle);
	const dirAudioText = resolve(dirSideData, 'audio-text');
	emptyDirSync(dirAudioText);



	const fileAudioEmpty = resolve(dirAudioSingle, 'e.wav');
	copyFileSync(resolve(dirSideData, 'e.wav'), fileAudioEmpty);


	const dirExportVoice = resolve(E.dirExportVoice, E.nameDirExport);
	const files = readdirSync(dirExportVoice).filter(file => file.endsWith('.wav'));

	const dicts = {};

	files.forEach((f, i) => {
		const event = Math.ceil((i + 1) / 50);

		(dicts[event] || (dicts[event] = [])).push(f);
	});

	const cmds = ['@echo off', dirAudioSingle.substring(0, 2), `cd "${dirAudioSingle}"`];


	const mapsFile = [];

	Object.entries(dicts).forEach(([event, filesInput], indexDict) => {
		const passes = ['ffmpeg'];

		filesInput.forEach((file, indexFile) => {
			const fileCopy = `${String(indexDict).padStart(3, '0')}-${String(indexFile).padStart(2, '0')}${parse(file).ext}`;

			copyFileSync(resolve(dirExportVoice, file), resolve(dirAudioSingle, fileCopy));

			passes.push('-i', `"${fileCopy}"`);
			passes.push('-i', `"e.wav"`);

			const textMap = `${fileCopy}|${file}`;

			mapsFile.push(textMap);
		});

		passes.pop();
		passes.pop();

		passes.push(
			'-filter_complex',
			`"${[...Array(filesInput.length * 2 - 1)].map((f, i) => `[${i}:0]`).join('')}concat=n=${filesInput.length * 2 - 1}:v=0:a=1[out]"`,
			'-map',
			'"[out]"',
			`%~dp0audio-concat\\concat-${String(indexDict).padStart(2, '0')}.mp3`,
		);

		cmds.push(passes.join(' '));
	});

	cmds.push(`explorer "${dirAudioConcat}"`);
	cmds.push('pause');

	writeFileSync(resolve(dirAudioSingle, '@audio-map.txt'), mapsFile.join('\n'));
	writeFileSync(resolve(dirSideData, 'concat-audio.bat'), Iconv.encode(cmds.join('\r\n'), 'GBK'));


	const { status, error, stderr, stdout } = spawnSync('cmd', ['/c', resolve(dirSideData, 'concat-audio.bat')]);
	if(status != 0) { throw (error && error.message) || (stderr && stderr.toString()); }

	process.stdout.write(Iconv.decode(stdout, 'GBK'));
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


	await concatAudioEvery50(configExtract);
}
catch(error) {
	GG.error('合并[语音]', error);
}
