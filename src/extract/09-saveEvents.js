import { existsSync, readFileSync, resolve, writeFileSync } from 'fs';
import Moment from 'moment';
import { C, dirCache, G, I } from '../../lib/global.js';
import { crc32, toHexL } from '../../lib/Tool.js';

const findFriendly = function(name, map) {
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

export default function saveEvents(mapAudioID_Event, arrAudioPackFile) {
	G.info(`[Main] Save Event info for dictaion`);

	let mapFriendlyRaw;

	try {
		mapFriendlyRaw = import(`../../data/FriendlyName/${C.lang}`);
	}
	catch(error) {
		mapFriendlyRaw = {};
	}

	const mapFriendly = {};

	for(const skill of 'QWER'.split('')) {
		mapFriendly[`${I.slot}${skill}`] = `使用:${skill.toUpperCase()}技能:`;
	}

	for(const raw in mapFriendlyRaw) {
		mapFriendly[raw] = mapFriendlyRaw[raw];
	}

	const eventMap = {};

	for(const [audioID, eventInfos] of Object.entries(mapAudioID_Event)) {
		let arrSrcCRC32 = arrAudioPackFile
			.map(file => resolve(dirCache, 'audio', file, `${audioID}.${C.format}`))
			.filter(src => existsSync(src))
			.map(src => crc32(readFileSync(src)));

		arrSrcCRC32 = new Set(arrSrcCRC32);

		let crc32Src;

		if(!arrSrcCRC32.size) {
			crc32Src = 'NOFILE';
		}
		else {
			if(arrSrcCRC32.size > 1) {
				G.info(`\t [WARING] Multi Take Audio File [${audioID}]`);
			}

			crc32Src = [...arrSrcCRC32].join('|');
		}

		const hex = toHexL(audioID, 8);

		const dict = import(`../../data/BaseData/${C.lang}.json`);
		const dictEN = import(`../../data/BaseData/en_us.json`);

		for(const eventInfo of eventInfos) {
			if(typeof eventInfo == 'object') {
				const slot = `[${String(C.id).padStart(3, '0')}${String(eventInfo.index).padStart(3, '0')}]`;

				const dChampion = dict[C.id];
				const dSkinCN = dChampion.skins[eventInfo.index];
				const dSkinEN = dictEN[C.id].skins[eventInfo.index];

				const skin = `${slot}${eventInfo.skinName.replace(/:/g, '')}` +
					`||${slot} ${dChampion.slot}:${dChampion.name}` + (eventInfo.index == 0 ? '' : ` ==> ${dSkinEN.name}:${dSkinCN.name}`);

				const skinMap = eventMap[skin] || (eventMap[skin] = {});

				(skinMap[eventInfo.short] || (skinMap[eventInfo.short] = [])).push({ hex, crc32: crc32Src });
			}
			else if(typeof eventInfo == 'number') {
				const skinMap = eventMap['[Bad]'] || (eventMap['[Bad]'] = {});

				(skinMap[eventInfo] || (skinMap[eventInfo] = [])).push({ hex, crc32: crc32Src });
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
			const eventTitle = `[${findFriendly(eventName, mapFriendly)}]|${eventName}`;

			arrEventList.push(`### ** ${eventTitle}`);

			const arrEventText = [];

			for(const { hex, crc32 } of arrAudioInfo) {
				arrEventText.push(`- >${hex}< CRC32[${crc32}] \`${hex}\` ***`);
			}

			arrEventText.sort();

			arrEventText.forEach(text => arrEventList.push(text.replace(/>.*< /g, '')));

			arrEventList.push('');
		}

		arrCatalog.forEach(text => result.push(text));
		result.push('## Lines:台词');
		arrEventList.forEach(text => result.push(text));

		writeFileSync(resolve('_texts', `[${I.slot}@${C.region}@${C.lang}]${skin.replace(/[:"]/g, '')}@${Moment().format('X')}.md`), result.join('\n'));
	}
}