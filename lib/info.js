import Day from 'dayjs';

import { C, G } from '@nuogz/pangu';

import { pad0 } from './utility.js';
import { D } from './database.js';
import { T } from './i18n.js';



export const I = {};

export const refreshInfo = () => {
	try {
		const [slotRaw, minRaw = '0', maxRaw] = C.target.split('|');

		const champion = Object.values(D).find(({ slot }) => slot.toLowerCase() == slotRaw.toLowerCase());


		if(!champion) { G.fatalE(1, T('where:Global'), T('matchChampion:do'), T('matchChampion:no', { slot: slotRaw })); }


		const { slot, id, name } = champion;

		I.slot = slot;
		I.id = id;
		I.champion = champion;

		G.info(T('where:Global'), T('matchChampion:do'), T('matchChampion:ok', { id, slot, name }));


		I.idsSkin = minRaw.split(',').map(id => Number(id));

		if(Number(maxRaw)) {
			for(let i = I.idsSkin[0] + 1; i <= Number(maxRaw); i++) {
				I.idsSkin.push(i);
			}
		}

		I.idsSkin.forEach(id => {
			let skin = I.champion?.skins[id];

			if(typeof skin == 'number') { skin = I.champion.skins[skin]?.chromas[id]; }

			if(skin) {
				G.info(T('where:Global'), T('matchSkin:do'), T('matchSkin:ok', { id: skin.id, name: skin.name }));
			}
			else {
				G.fatalE(1, T('where:Global'), T('matchSkin:do'), T('matchSkin:no', { id: skin.id }));
			}
		});


		G.info(T('where:Global'), T('matchLanguage:do'), T('matchLanguage:ok', { lang: C.lang }));
		G.info(T('where:Global'), T('matchServer:do'), T('matchServer:ok', C.server));

		I.time = Day().format('MMDDHHmmss');

		I.langStandard = C.lang.replace('_', '-');
		I.id0Full = `${pad0(I.id)}${pad0(I.idsSkin[0])}`;
	}
	catch(error) {
		G.error(T('where:Global'), T('matchInfo'), error);
	}
};
refreshInfo();
