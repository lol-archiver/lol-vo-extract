import C_ from './global.config.js';
import G_ from './global.log.js';
import TT_ from './global.i18n.js';
import { D as D_ } from './global.dataBase.js';

export const C = C_;
export const G = G_;
export const TT = TT_;
export const D = D_;


process.title = 'lol-vo-extract';
process.on('unhandledRejection', (error, promise) => { G.fatal(TT('where:Process'), TT('error:unhandledRejection'), error); });


export const I = {};
try {
	const [slotRaw, minRaw = '0', maxRaw] = C.target.split('|');

	const champion = Object.values(D).find(({ slot }) => slot.toLowerCase() == slotRaw.toLowerCase());


	if(!champion) { G.fatalE(1, TT('where:Global'), TT('matchChampion:do'), TT('matchChampion:no', { slot: slotRaw })); }


	const { slot, id, name } = champion;

	I.slot = slot;
	I.id = id;
	I.champion = champion;

	G.info(TT('where:Global'), TT('matchChampion:do'), TT('matchChampion:ok', { id, slot, name }));


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
			G.info(TT('where:Global'), TT('matchSkin:do'), TT('matchSkin:ok', { id: skin.id, name: skin.name }));
		}
		else {
			G.fatalE(1, TT('where:Global'), TT('matchSkin:do'), TT('matchSkin:no', { id: skin.id }));
		}
	});


	G.info(TT('where:Global'), TT('matchLanguage:do'), TT('matchLanguage:ok', { lang: C.lang }));
	G.info(TT('where:Global'), TT('matchServer:do'), TT('matchServer:ok', C.server));
}
catch(error) {
	G.error(TT('where:Global'), TT('matchInfo'), error);
}