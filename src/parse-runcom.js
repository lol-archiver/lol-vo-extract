import { Day } from '@nuogz/pangu';


import pluginWeekOfYear from 'dayjs/plugin/weekOfYear.js';
import pluginAdvancedFormat from 'dayjs/plugin/advancedFormat.js';

import { TLogError } from '../lib/utility.js';
import { en_us } from '../lib/database.js';


Day.extend(pluginWeekOfYear);
Day.extend(pluginAdvancedFormat);



const championsEN = Object.values(en_us);



/**
 * @param {(string|import('../bases.d.ts').RawRuncomConfig)[]} rawsRuncom
 * @returns {import('../bases.d.ts').RuncomConfig[]}
 */
export default function parseRuncom(rawsRuncom = []) {
	/** @type {import('../bases.d.ts').RuncomConfig[]} */
	const runcoms = [];

	for(const rawRuncom of rawsRuncom) {
		const typeRawRuncom = typeof rawRuncom;
		if(typeRawRuncom != 'string' && !(rawRuncom instanceof Array)) { throw TLogError('parse-runcom', { rc: rawRuncom }, 'invalid-type'); }
		if((typeRawRuncom == 'string' ? rawRuncom : rawRuncom[0])?.startsWith('-')) { continue; }


		/** @type {import('../bases.d.ts').RuncomConfig} */
		const runcom = { mode: typeRawRuncom == 'string' ? 'skin' : 'specify' };


		if(runcom.mode == 'skin') {
			const [slot, idSkin, title, profile] = rawRuncom.split('|');

			const champion = championsEN[Number(slot)] || championsEN.find(c => c.slot.toLowerCase() == slot.toLowerCase());
			if(!champion) { throw '找不到对应英雄'; }
			runcom.champion = champion;


			const skin = champion.skins[idSkin];
			if(!skin) { throw '找不到对应皮肤'; }
			runcom.skin = skin;
			// if(!champion) { throw TLogError('parse-runcom', { rc, slot: slotRC }, 'unknown-champion'); }

			if(typeof skin == 'number') {
				runcom.skinParent = champion.skins[skin];

				runcom.skin = runcom.skinParent.chromas[idSkin];
			}


			if(title) { runcom.title = title; }
			if(profile) { runcom.profile = profile; }
		}
		else {
			const [slot, title, profile] = rawRuncom[0].split('|');

			runcom.slot = slot;
			runcom.title = title;
			if(profile) { runcom.profile = profile; }
			runcom.filesGame = rawRuncom.slice(1) ?? [];
		}

		runcoms.push(runcom);
	}

	return runcoms;
}
