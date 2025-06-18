import { G } from '@nuogz/pangu';

import { writeFileSync } from 'fs';
import { resolve } from 'path';

import Filenamify from 'filenamify';

import { toHexL8, pad0, showID } from '../lib/utility.js';
import { champions$lang } from '../lib/database.js';

import { HIRCContainer, HIRCEvent, HIRCAction, HIRCSwitch, HIRCSound } from './entry/bnk/HIRCObject.js';

const GG = G.where('[to-i18n] Save Dictation');



const keysUseless = [
	'_cast',
	'cast',
];

const convertEventNameToTitle = (name, mapsTitleEvent$name) => {
	let nameFormat = name.toLowerCase().replace(/[235]d/g, '');

	const trans = mapsTitleEvent$name.reduce((acc, [key, nameFriendly]) => {
		if(key instanceof RegExp && key.test(nameFormat)) {
			nameFormat = nameFormat.replace(key, '');

			acc.push(nameFriendly);
		}
		else if(typeof key == 'string' && nameFormat.includes(key)) {
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


const pushHIRCObjectText = (object, id, objectParent, objects, texts, level = 0) => {
	if(!object) {
		if(id) { return texts.push(`${'\t'.repeat(level)}@Unknown[${showID(id)}]`); }

		return;
	}

	if(object instanceof HIRCSound) {
		const idsSound = objectParent.idsSound ?? objectParent.idsChildren ?? [];
		const index = idsSound.indexOf(object.id);

		texts.push(`- \`${toHexL8(object.id)}|${toHexL8(object.idAudio)}|index=${String(index).padStart(2, '0')}\` ***`);
	}
	else {
		texts.push(`${'\t'.repeat(level)}@${object.toString()}`);
	}


	if(object instanceof HIRCEvent) {
		for(const idAction of object.idsAction) {
			pushHIRCObjectText(objects.find(o => o.id == idAction), idAction, object, objects, texts, level + 1);
		}

		texts.push('');
	}
	else if(object instanceof HIRCAction) {
		pushHIRCObjectText(objects.find(o => o.id == object.idTarget), object.idTarget, object, objects, texts, level + 1);
	}
	else if(
		object instanceof HIRCContainer ||
		object instanceof HIRCSwitch
	) {
		// Switch Conatiner
		if(object.type == 6) {
			object.switches.filter(sw => sw.idsChildren?.length).forEach(sw => texts.push(`${'\t'.repeat(level + 1)}@${sw.toString()}`));
		}

		for(const idSound of(object.idsSound ?? object.idsChildren).toSorted((a, b) => toHexL8(a) > toHexL8(b) ? 1 : -1)) {
			const objectChild = objects.find(e => e.id == idSound);

			pushHIRCObjectText(objectChild, idSound, object, objects, texts, level + 1);
		}
	}
};


/**
 * @param {import('./entry/bnk/HIRCObject.js').HIRCObject[]} objectsBNKAll
 * @param {import('../bases.js').ExtractConfig} E
 */
export default async function saveDictation(objectsBNKAll, E) {
	/** @type {Array<[string, string]>} */
	const mapsTitleEvent$name = [];

	if(E.mode == 'skin') {
		for(let i = 1; i < 8; i++) {
			mapsTitleEvent$name.push([E.slot + 'BasicAttack' + i, '普攻']);
			mapsTitleEvent$name.push([E.slot + 'CritAttack' + i, '暴击']);
		}
		mapsTitleEvent$name.push([E.slot + 'BasicAttack', '普攻']);
		mapsTitleEvent$name.push([E.slot + 'CritAttack', '暴击']);

		for(const key in E.champion.spells) {
			const keyUppser = key.toUpperCase();
			const textUsage = keyUppser == 'P' ? '触发' : '使用';
			const textSkill = `${textUsage}:${keyUppser}${E.champion.spells[key]}`;

			mapsTitleEvent$name.push([`${E.slot}${keyUppser}`, textSkill]);
			mapsTitleEvent$name.push([`Spell${keyUppser}`, textSkill]);
		}
	}

	try {
		mapsTitleEvent$name.push(...(await import(`../data/friendly-name/${E.lang}.js`)).default);
	}
	catch { void 0; }


	Object.values(champions$lang[E.lang]).forEach(champion => {
		Object.values(champion.skins).filter(skin => typeof skin == 'object').forEach(skin => {
			mapsTitleEvent$name.push([`${champion.slot}Skin${String(skin.id).padStart(2, '0')}`, `皮肤:${skin.name}`]);
		});

		mapsTitleEvent$name.push([new RegExp(`${champion.slot}Skin\\d+`, 'i'), `皮肤: ${champion.name}`]);
		mapsTitleEvent$name.push([champion.slot, `英雄:${champion.name}`]);
	});

	mapsTitleEvent$name.forEach(map => (
		map[0] = typeof map[0] == 'string' ? map[0].trim().toLowerCase() : map[0],
		map[1] = map[1].trim()
	));


	const textsDictation = [`# ${E.titleFileDictation}`, '## Catalog:目录', '## Lines:台词'];

	const textersEvent = [];
	for(const event of objectsBNKAll.filter(object => object instanceof HIRCEvent)) {
		const nameEventShort = event.name
			.replace(/^play_vo_/i, '')
			.replace(new RegExp(`^${E.champion?.slot}${E.skin?.id ? `skin${pad0(E.skin.id, 2)}` : ''}_`, 'i'), '');


		const texterEvent = {
			nameEventShort,
			titleEvent: convertEventNameToTitle(nameEventShort, mapsTitleEvent$name),
			texts: [],
		};
		textersEvent.push(texterEvent);

		pushHIRCObjectText(event, event.id, {}, objectsBNKAll, texterEvent.texts);


		for(const action of objectsBNKAll.filter(object => event.idsAction.includes(object.id))) {
			if(action instanceof HIRCAction == false) {
				GG.warn(`[to-i18n] event-action-not-action`, action.toString());

				continue;
			}
		}
	}

	for(const texterEvent of textersEvent.sort(({ nameEventShort: a }, { nameEventShort: b }) => a > b ? 1 : -1)) {
		textsDictation.push(`### **[${texterEvent.titleEvent}]|${texterEvent.nameEventShort}`);

		for(const text of texterEvent.texts) {
			textsDictation.push(text);

		}

		textsDictation.push('');
	}


	writeFileSync(resolve(E.dirExportDict, Filenamify(`${E.nameFileDictation}.md`)), textsDictation.join('\n'));
	// (await import('child_process')).spawn('explorer', [`${E.nameFileDictation}.md`], { cwd: E.dirExportDict });
}
