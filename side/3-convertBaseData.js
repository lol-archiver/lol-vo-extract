import AS from 'assert';
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import FX from 'fs-extra';

import { C } from '../lib/global.js';


const regions = ['default', 'zh_cn'];

const dirSelf = dirname(fileURLToPath(import.meta.url));
const dirRaw = C.path.dirRaw;



const convert = (region) => {
	const dirBase = resolve(dirRaw, 'plugins', 'rcp-be-lol-game-data', 'global', region, 'v1');
	const championsSum = FX.readJsonSync(resolve(dirBase, 'champion-summary.json'));

	const result = {};
	const countsChroma = {};

	championsSum.forEach(({ id }) => {
		if(id < 0) { return; }

		const { name, title, alias: slot, roles, skins: skinsRaw, spells: spellsRaw, passive: passiveRaw } =
			FX.readJsonSync(resolve(dirBase, 'champions', `${id}.json`));

		const champion = result[id] = {
			id,
			name: region == 'zh_cn' ? title : name,
			title: region == 'zh_cn' ? name : title,
			slot,
			roles,
			skins: {},
			spells: {
				p: passiveRaw.name || null,
				q: (Object.values(spellsRaw).find(s => s.spellKey == 'q') || { name: null }).name,
				w: (Object.values(spellsRaw).find(s => s.spellKey == 'w') || { name: null }).name,
				e: (Object.values(spellsRaw).find(s => s.spellKey == 'e') || { name: null }).name,
				r: (Object.values(spellsRaw).find(s => s.spellKey == 'r') || { name: null }).name,
			}
		};
		const { skins } = champion;


		for(const { id, name, chromas = [], questSkinInfo: { tiers = [] } = {} } of skinsRaw) {
			const idSkin = ~~String(id).substr(-3, 3);

			const skin = skins[idSkin] = {
				id: idSkin,
				name,
				nameStage: '',
				chromas: {},
				stage: 0,
			};

			for(const { id, name, colors } of chromas) {
				const idChroma = ~~String(id).substr(-3, 3);

				AS(!skins[idChroma]);
				AS(colors.length == 2);

				skins[idChroma] = idSkin;

				(countsChroma[colors.join()] || (countsChroma[colors.join()] = [])).push(name);

				skin.chromas[idChroma] = {
					id: idChroma,
					name,
					colors
				};
			}

			if(!tiers.length) {
				delete skin.nameStage;
				delete skin.stage;
			}

			for(const { id, name, stage, shortName, colors = [] } of tiers) {
				const idChroma = ~~String(id).substr(-3, 3);

				if(idSkin == idChroma) {
					skin.nameStage = name;
					skin.name = skin.name.replace(` ${shortName}`, '');
					skin.stage = stage;
				}
				else {
					AS(!skins[idChroma]);
					AS(colors.length == 0);

					skins[idChroma] = idSkin;

					skin.chromas[idChroma] = {
						id: idChroma,
						name,
						stage
					};
				}

			}
		}
	});

	for(const key in countsChroma) {
		const element = countsChroma[key];

		if(element.length > 4) {
			delete countsChroma[key];
		}
	}

	// writeFileSync(resolve(dirSelf, '..', 'data', 'BaseData', `${region}-chromaCounts.json`), JSON.stringify(countsChroma, null, '\t'));

	writeFileSync(resolve(dirSelf, '..', 'data', 'BaseData', `${region}-new.json`), JSON.stringify(result, null, '\t')
		.replace(/ · /g, '·')
		.replace(/ {2}/g, ' ')
		.replace(RegExp(Buffer.from([0xc2, 0xa0]).toString(), 'g'), ' ')
		.replace(/ *",/g, '",')
	);
};

regions.forEach(region => convert(region));