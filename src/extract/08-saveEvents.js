import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { C, G } from '@nuogz/pangu';

import { D, en_us } from '../../lib/database.js';
import { dirCache, dirText } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { crc32, pad0, toHexL8 } from '../../lib/utility.js';



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
		mapsFriendly.push(...(await import(`../../data/FriendlyName/${C.lang}.js`)).default);
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

	for(const [audioID, eventInfos] of Object.entries(eventsAll$idAudio)) {
		let crcsSrc = namesFileSoundBank
			.map(file => resolve(dirCache, 'audio', file, 'wem', `${audioID}.wem`))
			.filter(src => existsSync(src))
			.map(src => crc32(readFileSync(src)));

		crcsSrc = new Set(crcsSrc);

		let crcSrc;

		if(!crcsSrc.size) {
			crcSrc = 'NONEFILE';
		}
		else {
			if(crcsSrc.size > 1) {
				G.warn('EventSaver', 'save event', `found multi extract audio file ~{${audioID}}`);
			}

			crcSrc = [...crcsSrc].join('|');
		}

		const hex = toHexL8(audioID);

		const dictEN = en_us;

		for(const eventInfo of eventInfos) {
			if(typeof eventInfo == 'object') {
				if(eventInfo.index || eventInfo.index === 0) {
					const slot = `${pad0(I.id)}${pad0(eventInfo.index)}`;

					const dChampion = D[I.id];
					const dSkinCN = dChampion.skins[eventInfo.index];
					const dSkinEN = dictEN[I.id].skins[eventInfo.index];

					const skin = `${slot}@${eventInfo.skinName.replace(/:/g, '')}` +
						`||[${slot}] ${dChampion.slot}:${dChampion.name}` + (eventInfo.index == 0 ? '' : ` ==> ${dSkinEN.name}:${dSkinCN.name}`);

					const skinMap = eventMap[skin] || (eventMap[skin] = {});

					(skinMap[eventInfo.short] || (skinMap[eventInfo.short] = [])).push({ hex, crc32: crcSrc, idsSound: idsSoundAll$idAudio[audioID] || [] });
				}
				else {
					const slot = `${pad0(I.id)}`;

					const dChampion = D[I.id];

					const skin = `${slot}@${eventInfo.skinName.replace(/:/g, '')}` +
						`||[${slot}] ${dChampion.slot}:${dChampion.name}`;

					const skinMap = eventMap[skin] || (eventMap[skin] = {});

					(skinMap[eventInfo.short] || (skinMap[eventInfo.short] = [])).push({ hex, crc32: crcSrc, idsSound: idsSoundAll$idAudio[audioID] || [] });
				}
			}
			else if(typeof eventInfo == 'number') {
				const skinMap = eventMap['[未知]'] || (eventMap['[未知]'] = {});

				(skinMap[eventInfo] || (skinMap[eventInfo] = [])).push({ hex, crc32: crcSrc });
			}
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

			for(const { hex, crc32, idsSound } of arrAudioInfo) {
				arrEventText.push(`- \`${idsSound.map(id => toHexL8(id)).join('.')}|${hex}|${crc32}\` ***`);
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
