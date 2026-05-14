import { C, Day, dirWorking } from '@nuogz/pangu';

import { resolve as resolvePath } from 'node:path';

import { ensureDirSync } from 'fs-extra/esm';

import pluginWeekOfYear from 'dayjs/plugin/weekOfYear.js';
import pluginAdvancedFormat from 'dayjs/plugin/advancedFormat.js';

import { champions$lang } from '../lib/database.js';
import { pad0 } from '../lib/utility.js';


Day.extend(pluginWeekOfYear);
Day.extend(pluginAdvancedFormat);



const assignProfileBase = (profile, profiles, target = {}) => {
	if(!profile) { profile = {}; }

	if(profile?.$base) {
		for(const base of profile.$base.split('+')) {
			assignProfileBase(profiles[base], profiles, target);
		}
	}

	Object.assign(target, profile);
	delete target.$base;

	return target;
};

const calcProfileLevel = (key, profiles) => {
	const profile = profiles[key];
	if(!profile) { return 0; }


	let level = 1;

	const keysBase = profile.$base?.split('+') ?? [];
	for(const keyBase of keysBase) {
		level += calcProfileLevel(keyBase, profiles);
	}


	return level;
};

/**
 * @param {import('../bases.d.ts').RuncomConfig[]} runcoms
 * @returns {import('../bases.d.ts').ExtractConfig[]}
 */
export default function parseExtractConfig(runcoms) {
	const timeExtract = Day();


	const profilesRawDefault = C.default;
	const profilesRawUser = C.user ?? {};

	const keysProfile = [...new Set([Object.keys(profilesRawDefault), Object.keys(profilesRawUser)].flat())].filter(key => !key.startsWith('$'));

	const profiles = {};
	for(const key of keysProfile) { profiles[key] = Object.assign({}, profilesRawDefault[key], profilesRawUser[key]); }

	keysProfile.sort((a, b) => calcProfileLevel(a, profiles) - calcProfileLevel(b, profiles));

	for(const key of keysProfile) { profiles[key] = assignProfileBase(profiles[key], profiles); }


	return runcoms.map(runcom => {
		const profile = runcom.profile ?? profilesRawUser?.$profile ?? profilesRawDefault?.$profile;

		/** @type {import('../bases.d.ts').ExtractConfig} */
		const E = Object.assign({ profile }, profiles[profile], runcom);


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


			E.nameDirCache = `${idFull}@${E.slot}${E.noRegionInExportFileName ? '' : `@${region}`}@${lang}@${timeExtract.format('YYMMww')}`;
			E.nameDirVoiceExport = `${idFull}@${skin.id == 0 ? `${champion.title} ${champion.name}` : `${skin.name}`?.replace(/[:"]/g, '')}${E.noRegionInExportFileName ? '' : `@${region}`}@${lang}`;
			E.nameFileDictation = `${E.nameDirVoiceExport}@${timeExtract.format('DDHHmmss')}`;
			E.titleFileDictation = `[${idFull}] ${champion.slot}:${champion.name} ==> ${skin.id == 0 ? `${championFallback.title}:${champion.title}` : `${skinFallback.name}:${skin.name}`}`;
		}
		else {
			E.nameDirCache = `${E.slot}@${timeExtract.format('YYMMww')}`;
			E.nameFileDictation = `${E.slot}@${E.title}@${timeExtract.format('HHmmss')}`;
			E.titleFileDictation = `[${E.slot}] ${E.title}`;
			E.nameDirVoiceExport = `${E.slot}@${E.title}@${lang}`;
		}


		E.dirExportVoice = E.dirExportVoice ?? resolvePath(dirWorking, '@1voice'); ensureDirSync(E.dirExportVoice);
		E.dirExportDict = E.dirExportDict ?? resolvePath(dirWorking, '@2dict'); ensureDirSync(E.dirExportDict);


		E.dirCache = E.dirCache ?? resolvePath(dirWorking, 'cache'); ensureDirSync(E.dirCache);

		E.dirCacheAsset = resolvePath(E.dirCache, '1-asset'); ensureDirSync(E.dirCacheAsset);
		E.dirCacheGame = resolvePath(E.dirCache, '2-game'); ensureDirSync(E.dirCacheGame);
		E.dirCacheAudio = resolvePath(E.dirCache, '3-audio', E.nameDirCache); ensureDirSync(E.dirCacheAudio);


		E.timeExtract = timeExtract;


		return E;
	});
};
