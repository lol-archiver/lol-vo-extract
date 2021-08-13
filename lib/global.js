import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ensureDirSync } from 'fs-extra';

import Poseidon from '@nuogz/poseidon';
import Hades from '@nuogz/hades';

import baseData from './BaseData.js';


process.title = 'lol-vo-extract';
// eslint-disable-next-line no-unused-vars, no-debugger
process.on('unhandledRejection', (error, promise) => { debugger; });


export const dirLib = dirname(fileURLToPath(import.meta.url));
export const dirApp = resolve(dirLib, '..');

export const dirConfig = resolve(dirApp, 'config');
export const dirLog = resolve(dirApp, 'log');
export const dirCache = resolve(dirApp, '_cache');

export const C = new Poseidon('_,log', dirConfig);
export const G = new Hades(C.log.name, C.log.level, dirLog, C.log.isColorText);


ensureDirSync(resolve(dirCache, 'manifest'));
ensureDirSync(resolve(dirCache, 'bundle'));
ensureDirSync(resolve(dirCache, 'chunk'));
ensureDirSync(resolve(dirCache, 'assets'));


export const I = {};
try {
	G.info('Global', 'detect', `language [${C.lang}]`);
	G.info('Global', 'detect', `cdn [${C.server.cdn}] sie [${C.server.sie}] region [${C.server.region}] solution [${C.server.solution}]`);

	const [slotRaw, minRaw = '0', maxRaw] = C.target.split('|');

	for(const champion of Object.values(baseData[C.lang] ?? baseData.en_us)) {
		const { slot, id, name } = champion;

		if(slot.toLowerCase() == slotRaw.toLowerCase()) {
			I.slot = slot;
			I.id = id;
			I.champion = champion;

			G.info('Global', 'detect', `slot [${slot}] id [${id}] name [${name}]`);

			break;
		}
	}

	if(!I.id) {
		G.error('Global', 'detect', `could not detect championSlot[${slotRaw}]`);

		process.exit(1);
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
			G.info('Global', 'detect', `skin id [${skin.id}] name [${skin.name}]`);
		}
		else {
			G.error('Global', 'detect', `could not detect skinID[${id}]`);

			process.exit(1);
		}
	});
}
catch(error) {
	G.error('Global', 'detect', error);
}