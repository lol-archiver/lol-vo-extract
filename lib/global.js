import FSX from 'fs-extra';
import { resolve } from 'path';

import Poseidon from '@nuogz/poseidon';
import Hades from '@nuogz/hades';

import baseData from './BaseData.js';
import { dirApp, dirCache, dirConfig, dirLog } from './globalDir.js';


process.title = 'lol-vo-extract';
// eslint-disable-next-line no-unused-vars, no-debugger
process.on('unhandledRejection', (error, promise) => { G.fatal('Process', 'UnhandledRejection', error); debugger; });

export const C = new Poseidon('_,log', dirConfig);
export const G = new Hades(C.log.name, C.log.level, dirLog, C.log.option);

const baseDataNow = baseData();

FSX.ensureDirSync(resolve(dirCache, 'manifest'));
FSX.ensureDirSync(resolve(dirCache, 'bundle'));
FSX.ensureDirSync(resolve(dirCache, 'chunk'));
FSX.ensureDirSync(resolve(dirCache, 'asset'));
FSX.ensureDirSync(resolve(dirCache, 'extract'));
FSX.ensureDirSync(resolve(dirCache, 'audio'));
FSX.emptyDirSync(resolve(dirCache, 'extract'));

FSX.ensureDirSync(resolve(dirApp, '_final'));
FSX.ensureDirSync(resolve(dirApp, '_text', '_pool'));


export const I = {};
try {
	const [slotRaw, minRaw = '0', maxRaw] = C.target.split('|');

	for(const champion of Object.values(baseDataNow)) {
		const { slot, id, name } = champion;

		if(slot.toLowerCase() == slotRaw.toLowerCase()) {
			I.slot = slot;
			I.id = id;
			I.champion = champion;

			G.info('Global', 'champion', `~[id]~{${id}} ~[slot]~{${slot}} ~[name]~{${name}}`);

			break;
		}
	}

	if(!I.id) {
		G.fatalE(1, 'Global', 'champion', `~[slot]~{${slotRaw}} not found`);
	}

	I.idsSkin = minRaw.split(',').map(id => Number(id));

	if(Number(maxRaw)) {
		for(let i = i.idsSkin[0] + 1; i <= Number(maxRaw); i++) {
			i.idsSkin.push(i);
		}
	}

	I.idsSkin.forEach(id => {
		let skin = I.champion?.skins[id];

		if(typeof skin == 'number') { skin = I.champion.skins[skin]?.chromas[id]; }

		if(skin) {
			G.info('Global', 'skin', `~[id]~{${skin.id}} ~[name]~{${skin.name}}`);
		}
		else {
			G.fatalE(1, 'Global', 'skin', `~[id]~{${id}} not found`);
		}
	});


	G.info('Global', 'language', `~[language]~{${C.lang}}`);
	G.info('Global', 'server', `~[region]~{${C.server.region}} ~[solution]~{${C.server.solution}}`, `~[cdn]~{${C.server.cdn}}`, `~[sie]~{${C.server.sie}}`);
}
catch(error) {
	G.error('Global', 'detect', error);
}