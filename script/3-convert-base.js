import '@nuogz/pangu/index.js?i18n&dir=<entry>/..&config&day&log=convert-base&log.willOutputConsoleError=true';
import { G, dirWorking } from '@nuogz/pangu';

import AS from 'assert';
import { writeFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

import { readJSONSync } from 'fs-extra/esm';

import { extractWAD } from '@lol-archiver/lol-wad-extract';

import { T } from '../lib/i18n.js';

import parseRuncom from '../src/parse-runcom.js';
import parseExtractConfig from '../src/parse-extract-config.js';

const GG = G.where(T('where:main'));



const regions = {
	'default': 'en_us',
	'zh_cn': 'zh_cn'
};


const dirData = resolvePath(dirWorking, 'data');


/** @param {import('../bases.d.ts').ExtractConfig} E */
const updateChampionsBase = async (E) => {
	const datasFixAll = readJSONSync(resolvePath(dirData, 'base-fix.json'));


	for(const regionGame in regions) {
		const regionReal = regions[regionGame];


		const fileAssets = resolvePath(E.dirGameDataPlugin, `${regionGame}-assets${regionGame == 'default' ? '2' : ''}.wad`);



		const [{ buffer: bufferSummary }] = await extractWAD(fileAssets, [
			{ fileInpack: `plugins/rcp-be-lol-game-data/global/${regionGame}/v1/champion-summary.json` },
		]);

		const championsSummary = JSON.parse(bufferSummary.toString());

		const buffersJSONChampion = await extractWAD(fileAssets, championsSummary.map(({ id }) =>
			({ fileInpack: `plugins/rcp-be-lol-game-data/global/${regionGame}/v1/champions/${id}.json`, id })
		));



		const result = {};
		const countsChroma = {};

		for(const { id } of championsSummary.filter(({ id }) => id > 0)) {
			let championRaw;
			try {
				championRaw = JSON.parse(buffersJSONChampion.find(b => b.id == id)?.buffer.toString());
			}
			catch { continue; }

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


			for(const { id: idSkinRaw, name: nameSkin, chromas = [], questSkinInfo: { tiers = [] } = {} } of skinsRaw) {
				const idSkin = ~~String(idSkinRaw).slice(-3);

				const skin = skins[idSkin] = {
					id: idSkin,
					name: nameSkin,
					nameStage: '',
					chromas: {},
					stage: 0,
				};

				for(const { id: idChromaRaw, name: nameChroma, colors } of chromas) {
					const idChroma = ~~String(idChromaRaw).slice(-3);

					AS(!skins[idChroma]);
					AS(colors.length == 2);

					skins[idChroma] = idSkin;

					(countsChroma[colors.join()] || (countsChroma[colors.join()] = [])).push(nameChroma);

					skin.chromas[idChroma] = {
						id: idChroma,
						name: nameChroma,
						colors
					};
				}

				if(!tiers.length) {
					delete skin.nameStage;
					delete skin.stage;
				}

				for(const { id: idTierRaw, name: nameTier, stage, shortName, colors = [] } of tiers) {
					const idChroma = ~~String(idTierRaw).slice(-3);

					if(idSkin == idChroma) {
						skin.nameStage = nameTier;
						skin.name = skin.name.replace(` ${shortName}`, '');
						skin.stage = stage;
					}
					else {
						AS(!skins[idChroma]);
						AS(colors.length == 0);

						skins[idChroma] = idSkin;

						skin.chromas[idChroma] = {
							id: idChroma,
							name: nameTier,
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
			catch { void 0; }
		}



		writeFileSync(
			resolvePath(dirData, 'base', `${regionReal}.json`),
			JSON.stringify(result, null, '\t')
				.replace(/ · /g, '·')
				.replace(/ {2}/g, ' ')
				.replace(RegExp(Buffer.from([0xc2, 0xa0]).toString(), 'g'), ' ')
				.replace(/ *",/g, '",')
			+ '\n'
		);
	}
};



try {
	const runcoms = parseRuncom(['morgana|0']);
	const configsExtract = parseExtractConfig(runcoms);

	await updateChampionsBase(configsExtract[0]);
}
catch(error) {
	GG.error('更新[基础]', error);
}
