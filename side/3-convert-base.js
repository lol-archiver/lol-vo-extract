import '../index.env.js';

import AS from 'assert';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { ensureDirSync, readJSONSync } from 'fs-extra/esm';

import { C, G } from '@nuogz/pangu';
import { extractWAD } from '@lol-archiver/lol-wad-extract';

import { dirCache, dirData } from '../lib/dir.js';



const regions = {
	'default': 'en_us',
	'zh_cn': 'zh_cn'
};


const dirSelf = dirname(fileURLToPath(import.meta.url));


const dirCacheSelf = resolve(dirCache, 'convert-base');
ensureDirSync(dirCacheSelf);


const datasFixAll = readJSONSync(resolve(dirData, 'base-fix.json'));


const convert = async (regionGame, regionReal) => {
	const fileAssets = resolve(C.path.dirGameDataRaw, `${regionGame}-assets.wad`);

	const { summary: bufferSummary } = await extractWAD(
		fileAssets,
		{
			[`plugins/rcp-be-lol-game-data/global/${regionGame}/v1/champion-summary.json`]: { type: 'buffer', key: 'summary' }
		}
	);

	const championsSummary = JSON.parse(bufferSummary.toString());

	const infoExtract = championsSummary.reduce((acc, { id }) => {
		acc[`plugins/rcp-be-lol-game-data/global/${regionGame}/v1/champions/${id}.json`] = { type: 'file', key: id, fileTarget: resolve(dirCacheSelf, `${id}.json`) };

		return acc;
	}, {});

	const buffersJSONChampion = await extractWAD(fileAssets, infoExtract);



	const result = {};
	const countsChroma = {};

	for(const { id } of championsSummary) {
		if(id <= 0) { continue; }

		let championRaw;
		try {
			championRaw = JSON.parse(readFileSync(buffersJSONChampion[id], 'utf8'));
		}
		catch(error) {
			continue;
		}

		const { name, title, alias: slot, roles, skins: skinsRaw, spells: spellsRaw, passive: passiveRaw } = championRaw;

		const champion = result[id] = {
			id,
			name: regionGame == 'zh_cn' ? title : name,
			title: regionGame == 'zh_cn' ? name : title,
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
			const idSkin = ~~String(id).slice(-3);

			const skin = skins[idSkin] = {
				id: idSkin,
				name,
				nameStage: '',
				chromas: {},
				stage: 0,
			};

			for(const { id, name, colors } of chromas) {
				const idChroma = ~~String(id).slice(-3);

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
				const idChroma = ~~String(id).slice(-3);

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


	const datasFix = Object.assign({}, datasFixAll.default, datasFixAll[regionReal]);

	for(const pathFix in datasFix) {
		const [strMatch, strReplace] = datasFix[pathFix].split('||');
		const pathsFix = pathFix.split('.');
		const keyTarget = pathsFix.pop();

		try {
			let now = result;

			for(const path of pathsFix) { now = now[path]; }

			if(now[keyTarget] == strMatch) {
				G.info('convert-base', 'fix data', `✔ ${pathFix}: ~{${strMatch}} ==> ~{${strReplace}}`);

				now[keyTarget] = strReplace;
			}
			else {
				G.warn('convert-base', 'fix data', `✖ ${pathFix}: ~{${strMatch}} changed, now is ~{${now[keyTarget]}}`);
			}
		}
		catch(error) { void 0; }
	}



	writeFileSync(
		resolve(dirSelf, '..', 'data', 'base', `${regionReal}.json`),
		JSON.stringify(result, null, '\t')
			.replace(/ · /g, '·')
			.replace(/ {2}/g, ' ')
			.replace(RegExp(Buffer.from([0xc2, 0xa0]).toString(), 'g'), ' ')
			.replace(/ *",/g, '",')
		+ '\n'
	);
};



for(const regionGame in regions) { await convert(regionGame, regions[regionGame]); }
