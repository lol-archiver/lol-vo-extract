import { C, Day, dirWorking } from '@nuogz/pangu';

import { resolve as resolvePath } from 'path';

import { ensureDirSync } from 'fs-extra/esm';

import pluginWeekOfYear from 'dayjs/plugin/weekOfYear.js';
import pluginAdvancedFormat from 'dayjs/plugin/advancedFormat.js';

import { champions$lang } from '../lib/database.js';
import { pad0 } from '../lib/utility.js';


Day.extend(pluginWeekOfYear);
Day.extend(pluginAdvancedFormat);



/**
 * @param {import('../bases.d.ts').RuncomConfig[]} runcoms
 * @returns {import('../bases.d.ts').ExtractConfig[]}
 */
export default function parseExtractConfig(runcoms) {
	const timeExtract = Day();

	return runcoms.map(runcom => {
		const profile = runcom.profile ?? C.user?.$?.profile ?? C.default?.$?.profile;

		/** @type {import('./bases.d.ts').ExtractConfig} */
		const E = Object.assign({}, C.default.$, C.default[profile], C.user.$, C.user[profile], runcom);


		E.lang = E.lang ?? 'zh_cn';
		const lang = !E.saveWithShort ? E.lang : E.lang.split('_')[0];
		const region = (!E.saveWithShort ? E.regionCDN : E.regionCDN.replace(/\d+$/, '')).toLowerCase();

		if(E.mode == 'skin') {
			const championFallback = E.champion;
			const skinFallback = E.skin;

			const champions = champions$lang[E.lang];

			const champion = E.champion = champions[String(championFallback.id)];
			const skin = E.skin = champion.skins[String(skinFallback.id)];

			E.slot = champion.slot.toLowerCase();
			E.title = skin.id == 0 ? `${champion.title} ${champion.name}` : skin.name;


			const idFull = `${pad0(champion.id)}${pad0(skin.id)}`;


			E.slotFile = `${idFull}@${E.slot}@${region}@${lang}@${timeExtract.format('YYMMww')}`;
			E.nameFile = `${idFull}@${(skin?.name)?.replace(/[:"]/g, '')}@${region}@${lang}@${timeExtract.format('DDHHmmss')}`;
			E.titleFile = `[${idFull}] ${champion.slot}:${champion.name} ==> ${skin.id == 0 ? `${championFallback.title}:${champion.title}` : `${skinFallback.title}:${skin.title}`}`;
			E.nameDirExport = `${idFull}@${(skin?.name)?.replace(/[:"]/g, '')}@${region}@${lang}`;
		}
		else {
			E.slotFile = `${E.slot}@${timeExtract.format('YYMMww')}`;
			E.nameFile = `${E.slot}@${E.title}@${timeExtract.format('HHmmss')}`;
			E.titleFile = `[${E.slot}] ${E.title}`;
			E.nameDirExport = `${E.slot}@${E.title}@${lang}`;
		}


		E.dirExportDebug = E.dirExportDebug ?? resolvePath(dirWorking, 'debug'); ensureDirSync(E.dirExportDebug);
		E.dirExportVoice = E.dirExportVoice ?? resolvePath(dirWorking, '@1voice'); ensureDirSync(E.dirExportVoice);
		E.dirExportDict = E.dirExportDict ?? resolvePath(dirWorking, '@2dict'); ensureDirSync(E.dirExportDict);


		E.dirCache = E.dirCache ?? resolvePath(dirWorking, 'cache'); ensureDirSync(E.dirCache);

		E.dirCacheAsset = resolvePath(E.dirCache, '1-asset'); ensureDirSync(E.dirCacheAsset);
		E.dirCacheUnpack = resolvePath(E.dirCache, '2-unpack'); ensureDirSync(E.dirCacheUnpack);
		E.dirCacheAudio = resolvePath(E.dirCache, '3-audio', E.slotFile); ensureDirSync(E.dirCacheAudio);


		E.timeExtract = timeExtract;


		return E;
	});
};
