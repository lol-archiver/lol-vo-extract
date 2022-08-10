import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import Moment from 'moment';

import { dirCache } from '../../lib/global.dir.js';
import { C, I, G } from '../../lib/global.js';
import { crc32, pad0, toHexL } from '../../lib/Tool.js';
import { D, en_us } from '../../lib/global.dataBase.js';


const findFriendlyName = (name, map) => {
	let nameFormat = name.toLowerCase().replace(/[23]d/g, '');
	const arrTrans = [];

	for(const raw in map) {
		if(nameFormat.includes(raw.toLowerCase())) {
			nameFormat = nameFormat.replace(raw.toLowerCase(), '');
			if(map[raw].trim()) { arrTrans.push(map[raw].trim()); }
		}
	}

	return arrTrans.join(':');
};

export default async function saveEvents(mapAudioID_Event, arrAudioPackFile) {
	G.info('EventSaver', 'save event');

	let mapFriendlyRaw;

	try {
		mapFriendlyRaw = (await import(`../../data/FriendlyName/${C.lang}.js`)).default;
	}
	catch(error) {
		mapFriendlyRaw = {};
	}


	const mapFriendly = {};


	for(const raw in mapFriendlyRaw) {
		mapFriendly[raw] = mapFriendlyRaw[raw];
	}

	Object.values(D).forEach(champion => {
		Object.values(champion.skins).filter(skin => typeof skin == 'object').forEach(skin => {
			mapFriendly[`${champion.slot}Skin${String(skin.id).padStart(2, '0')}`] = `皮肤:${skin.name}`;
		});
		mapFriendly[champion.slot] = `英雄:${champion.name}`;
	});

	for(const key in I.champion.spells) {
		mapFriendly[`${I.slot}${key.toUpperCase()}`] = `${key == 'p' ? '触发' : '使用'}:${key.toUpperCase()}技能:${I.champion.spells[key]}`;
	}


	const eventMap = {};

	for(const [audioID, eventInfos] of Object.entries(mapAudioID_Event)) {
		let crcsSrc = arrAudioPackFile
			.map(file => resolve(dirCache, 'audio', file, 'wem', `${audioID}.wem`))
			.filter(src => existsSync(src))
			.map(src => crc32(readFileSync(src)));

		crcsSrc = new Set(crcsSrc);

		let crcSrc;

		if(!crcsSrc.size) {
			crcSrc = 'NOFILE';
		}
		else {
			if(crcsSrc.size > 1) {
				G.warn('EventSaver', 'save event', `found multi extract audio file ~{${audioID}}`);
			}

			crcSrc = [...crcsSrc].join('|');
		}

		const hex = toHexL(audioID, 8);

		const dictEN = en_us;

		for(const eventInfo of eventInfos) {
			if(typeof eventInfo == 'object') {
				const slot = `[${pad0(I.id)}${pad0(eventInfo.index)}]`;

				const dChampion = D[I.id];
				const dSkinCN = dChampion.skins[eventInfo.index];
				const dSkinEN = dictEN[I.id].skins[eventInfo.index];

				const skin = `${slot}${eventInfo.skinName.replace(/:/g, '')}` +
					`||${slot} ${dChampion.slot}:${dChampion.name}` + (eventInfo.index == 0 ? '' : ` ==> ${dSkinEN.name}:${dSkinCN.name}`);

				const skinMap = eventMap[skin] || (eventMap[skin] = {});

				(skinMap[eventInfo.short] || (skinMap[eventInfo.short] = [])).push({ hex, crc32: crcSrc });
			}
			else if(typeof eventInfo == 'number') {
				const skinMap = eventMap['[Bad]'] || (eventMap['[Bad]'] = {});

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
			const eventTitle = `[${findFriendlyName(eventName, mapFriendly)}]|${eventName}`;

			arrEventList.push(`### ** ${eventTitle}`);

			const arrEventText = [];

			for(const { hex, crc32 } of arrAudioInfo) {
				arrEventText.push(`- >${hex}< \`${hex}|${crc32}\` ***`);
			}

			arrEventText.sort();

			arrEventText.forEach(text => arrEventList.push(text.replace(/>.*< /g, '')));

			arrEventList.push('');
		}

		arrCatalog.forEach(text => result.push(text));
		result.push('## Lines:台词');
		arrEventList.forEach(text => result.push(text));

		writeFileSync(resolve('@text', `[${I.slot}@${C.server.region}@${C.lang}]${skin.replace(/[:"]/g, '')}@${Moment().format('X')}.md`), result.join('\n'));
	}
}
