import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { toHexL8, pad0 } from '../lib/utility.js';
import { champions$lang } from '../lib/database.js';



const keysUseless = [
	'_cast',
	'cast',
];

const matchFriendlyName = (name, mapsFriendly) => {
	let nameFormat = name.toLowerCase().replace(/[235]d/g, '');

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


/**
 * @param {Object<string, string[]>} events$idAudio
 * @param {Object<string, Set<number>>} idsSound$idAudio
 * @param {import('../bases.js').ExtractConfig} E
 */
export default async function saveDictation(events$idAudio, idsSound$idAudio, E) {
	// G.info('EventSaver', 'save event');


	/** @type {Array<[string,string]>} */
	const mapsFriendly = [];

	if(E.mode == 'skin') {
		for(let i = 1; i < 8; i++) {
			mapsFriendly.push([E.slot + 'BasicAttack' + i, '普攻']);
			mapsFriendly.push([E.slot + 'CritAttack' + i, '暴击']);
		}
		mapsFriendly.push([E.slot + 'BasicAttack', '普攻']);
		mapsFriendly.push([E.slot + 'CritAttack', '暴击']);

		for(const key in E.champion.spells) {
			const keyUppser = key.toUpperCase();
			const textUsage = keyUppser == 'P' ? '触发' : '使用';
			const textSkill = `${textUsage}:${keyUppser}${E.champion.spells[key]}`;

			mapsFriendly.push([`${E.slot}${keyUppser}`, textSkill]);
			mapsFriendly.push([`Spell${keyUppser}`, textSkill]);
		}
	}

	try {
		mapsFriendly.push(...(await import(`../../data/friendly-name/${E.lang}.js`)).default);
	}
	catch { void 0; }


	Object.values(champions$lang[E.lang]).forEach(champion => {
		Object.values(champion.skins).filter(skin => typeof skin == 'object').forEach(skin => {
			mapsFriendly.push([`${champion.slot}Skin${String(skin.id).padStart(2, '0')}`, `皮肤:${skin.name}`]);
		});

		mapsFriendly.push([champion.slot, `英雄:${champion.name}`]);
	});

	mapsFriendly.forEach(map => (
		map[0] = map[0].trim().toLowerCase(),
		map[1] = map[1].trim()
	));



	const skinMap = {};
	for(const [idAudio, events] of Object.entries(events$idAudio)) {
		const idAudioHex = toHexL8(idAudio);

		for(const event of events) {
			(skinMap[event] || (skinMap[event] = [])).push({ idAudioHex, idsSound: idsSound$idAudio[idAudio] || [] });
		}
	}


	const result = [`# ${E.titleFile}`];


	const arrCatalog = ['## Catalog:目录'];
	const arrEventList = [];

	for(const [eventName, arrAudioInfo] of Object.entries(skinMap).sort(([a], [b]) => a > b ? 1 : -1)) {
		const eventShort = eventName.toLowerCase()
			.replace(/^play_vo_/, '')
			.replace(new RegExp(`^${E.champion?.slot}${E.skin?.id ? `skin${pad0(E.skin.id, 2)}` : ''}_`.toLowerCase()), '');

		const eventTitle = `[${matchFriendlyName(eventShort, mapsFriendly)}]|${eventShort}`;

		arrEventList.push(`### ** ${eventTitle}`);

		const arrEventText = [];

		for(const { idAudioHex, idsSound } of arrAudioInfo) {
			arrEventText.push(`- \`${[...idsSound].map(id => toHexL8(id)).join('.')}|${idAudioHex}\` ***`);
		}

		arrEventText.sort();

		arrEventText.forEach(text => arrEventList.push(text));

		arrEventList.push('');
	}

	arrCatalog.forEach(text => result.push(text));
	result.push('## Lines:台词');
	arrEventList.forEach(text => result.push(text));


	writeFileSync(resolve(E.dirExportDict, `${E.nameFile}.md`), result.join('\n'));
}
