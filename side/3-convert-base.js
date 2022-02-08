import AS from 'assert';
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { extractWAD } from '@nuogz/lol-wad-extract';

import { C } from '../lib/global.js';


const regions = ['default', 'zh_cn'];

const dirSelf = dirname(fileURLToPath(import.meta.url));


const convert = async (region) => {
	const fileAssets = resolve(C.path.dirBase, `${region}-assets.wad`);

	const { summary: bufferSummary } = await extractWAD(
		fileAssets,
		{
			[`plugins/rcp-be-lol-game-data/global/${region}/v1/champion-summary.json`]: 'buffer|summary'
		}
	);

	const championsSummary = JSON.parse(bufferSummary.toString());

	const infoExtract = championsSummary.reduce((acc, { id }) => {
		acc[`plugins/rcp-be-lol-game-data/global/${region}/v1/champions/${id}.json`] = `buffer|${id}`;

		return acc;
	}, {});

	const buffersJSONChampion = await extractWAD(fileAssets, infoExtract);



	const result = {};
	const countsChroma = {};

	for(const { id } of championsSummary) {
		if(id <= 0) { continue; }

		const { name, title, alias: slot, roles, skins: skinsRaw, spells: spellsRaw, passive: passiveRaw } =
			JSON.parse(buffersJSONChampion[id].toString());

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
	}

	for(const key in countsChroma) {
		const element = countsChroma[key];

		if(element.length > 4) {
			delete countsChroma[key];
		}
	}

	// writeFileSync(resolve(dirSelf, '..', 'data', 'base', `${region}-chromaCounts.json`), JSON.stringify(countsChroma, null, '\t'));

	writeFileSync(resolve(dirSelf, '..', 'data', 'base', `${region}-new.json`), JSON.stringify(result, null, '\t')
		.replace(/ · /g, '·')
		.replace(/ {2}/g, ' ')
		.replace(RegExp(Buffer.from([0xc2, 0xa0]).toString(), 'g'), ' ')
		.replace(/ *",/g, '",')
	);
};

for(const region of regions) { await convert(region); }