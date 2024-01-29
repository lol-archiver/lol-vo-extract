import { C, G } from '@nuogz/pangu';

import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { dirText } from '../../lib/dir.js';
import { T } from '../../lib/i18n.js';
import { pad0, toHexL8 } from '../../lib/utility.js';
import { I } from '../../lib/info.js';
import { D, en_us } from '../../lib/database.js';



const keysUseless = [
	'_cast',
	'cast',
];

const matchFriendlyName = (name, mapsFriendly) => {
	let nameFormat = name.toLowerCase().replace(/[23]d/g, '');

	const trans = mapsFriendly.reduce((acc, [key, nameFriendly]) => {
		if(nameFormat.includes(key)) {
			nameFormat = nameFormat.replace(key, '');

			acc.push(nameFriendly);
		}

		return acc;
	}, []).filter(t => t);

	if(nameFormat &&
		!keysUseless.reduce((acc, key) => acc + nameFormat.includes(key), 0)
	) { trans.push(''); }

	return trans.join(':');
};

export default async function saveEvents(eventsAll$idAudio, namesFileSoundBank, idsSoundAll$idAudio, infosExtract$pathInWAD) {
	G.info('EventSaver', 'save event');


	/** @type {Array<[string,string]>} */
	const mapsFriendly = [];

	for(let i = 1; i < 8; i++) {
		mapsFriendly.push([I.slot + 'BasicAttack' + i, '普攻']);
		mapsFriendly.push([I.slot + 'CritAttack' + i, '暴击']);
	}
	mapsFriendly.push([I.slot + 'BasicAttack', '普攻']);
	mapsFriendly.push([I.slot + 'CritAttack', '暴击']);

	for(const key_ in I.champion.spells) {
		const key = key_.toUpperCase();
		const textUsage = key == 'P' ? '触发' : '使用';
		const textSkill = `${textUsage}:${key}${I.champion.spells[key_]}`;

		mapsFriendly.push([`${I.slot}${key}`, textSkill]);
		mapsFriendly.push([`Spell${key}`, textSkill]);
	}

	try {
		mapsFriendly.push(...(await import(`../../data/friendly-name/${C.lang}.js`)).default);
	}
	catch(error) { void 0; }


	Object.values(D).forEach(champion => {
		Object.values(champion.skins).filter(skin => typeof skin == 'object').forEach(skin => {
			mapsFriendly.push([`${champion.slot}Skin${String(skin.id).padStart(2, '0')}`, `皮肤:${skin.name}`]);
		});

		mapsFriendly.push([champion.slot, `英雄:${champion.name}`]);
	});

	mapsFriendly.forEach(map => (
		map[0] = map[0].trim().toLowerCase(),
		map[1] = map[1].trim()
	));


	const eventMap = {};

	for(const [idAudio, eventInfos] of Object.entries(eventsAll$idAudio)) {
		const idAudioHex = toHexL8(idAudio);

		const dictEN = en_us;

		for(const eventInfo of eventInfos) {
			const idSkin = eventInfo?.index || eventInfo?.index === 0 ? eventInfo.index : I.idsSkin?.[0];
			const statusMatch = typeof eventInfo == 'number' ? `(${T('match:unmatchEvent')})` : !(eventInfo?.index || eventInfo?.index === 0) ? `(${T('match:unmatchSkin')})` : '';


			const dChampion = D[I.id];
			const dSkin = dChampion.skins[idSkin];
			const dSkinFallback = dictEN[I.id].skins[idSkin];


			const slot = `${pad0(I.id)}${pad0(idSkin)}`;

			const prefixFile = `${slot}@${statusMatch}${(eventInfo?.skinName ?? dSkin?.name)?.replace(/[:"]/g, '')}`;
			const titleFile = `[${slot}]${statusMatch} ${dChampion.slot}:${dChampion.name}${idSkin == 0 ? '' : ` ==> ${dSkinFallback.name}:${dSkin.name}`}`;

			const keySkin = `${prefixFile}||${titleFile}`;
			const keyEvent = eventInfo?.short ?? eventInfo?.name ?? eventInfo;


			const skinMap = eventMap[keySkin] || (eventMap[keySkin] = {});
			(skinMap[keyEvent] || (skinMap[keyEvent] = [])).push({ idAudioHex, idsSound: idsSoundAll$idAudio[idAudio] || [] });
		}
	}

	for(const [skin_, skinMap] of Object.entries(eventMap)) {
		const [skin, head] = skin_.split('||');
		const result = [];

		result.push(`# ${head}`);

		const arrCatalog = ['## Catalog:目录'];
		const arrEventList = [];

		for(const [eventName, arrAudioInfo] of Object.entries(skinMap).sort(([a], [b]) => a > b ? 1 : -1)) {
			const eventTitle = `[${matchFriendlyName(eventName, mapsFriendly)}]|${eventName}`;

			arrEventList.push(`### ** ${eventTitle}`);

			const arrEventText = [];

			for(const { idAudioHex, idsSound } of arrAudioInfo) {
				arrEventText.push(`- \`${idsSound.map(id => toHexL8(id)).join('.')}|${idAudioHex}\` ***`);
			}

			arrEventText.sort();

			arrEventText.forEach(text => arrEventList.push(text));

			arrEventList.push('');
		}

		arrCatalog.forEach(text => result.push(text));
		result.push('## Lines:台词');
		arrEventList.forEach(text => result.push(text));

		const lang = !C.saveWithShort ? C.lang : C.lang.split('_')[0];
		const region = (!C.saveWithShort ? C.server.region : C.server.region.replace(/\d+$/, '')).toLowerCase();

		writeFileSync(resolve(dirText, `${skin.replace(/[:"]/g, '') ?? I.slot}@${I.time}@${region}@${lang}.md`), result.join('\n'));
	}
}
