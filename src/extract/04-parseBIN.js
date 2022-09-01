import { existsSync } from 'fs';
import { parse } from 'path';

import { G } from '@nuogz/pangu';
import Biffer from '@nuogz/biffer';

import { D } from '../../lib/database.js';
import { I } from '../../lib/info.js';



export default function parseBIN(binPath, indexSkin) {
	if(!existsSync(binPath)) { return; }

	// G.info('BINParser', `[${_pa.parse(binPath).base}]`);

	const bifferBin = new Biffer(binPath);

	const arrEvent = [];

	let skinNameFinal = null;
	let isBase = false;

	let idSkin;
	if(bifferBin.find([0xae, 0xf4, 0x77, 0xa9]) > -1) {
		[idSkin] = bifferBin.unpack('5xL');
		idSkin = ~~String(idSkin).slice(-3);
	}
	else {
		const subID = parse(binPath).base.match(/\d+/)[0];
		// idSkin = `${I.id}${pad0(subID)}`;
		idSkin = ~~subID;
	}

	const skin = D[I.id].skins[idSkin];
	if(!skin) {
		if(bifferBin.findFromStart([0x48, 0x1c, 0x4b, 0x51]) > -1) {
			G.info('BINParser', `detect ~[id]~{${idSkin}}`, `~[chroma] skip`);

			return;
		}
		else if(bifferBin.findFromStart([0x80, 0x58, 0x22, 0x87]) > -1) {
			const [clazz] = bifferBin.unpack('5xB');

			if(clazz == 1) {
				skinNameFinal = idSkin;

				G.info('BINParser', `detect ~[id]~{${idSkin}}`, `~[unknown Skin]~{${skinNameFinal}}`);
			}
			else if(clazz == 2) {
				G.info('BINParser', `detect ~[id]~{${idSkin}}`, `~[chroma] skip`);

				return;
			}
		}

		G.info('BINParser', `detect ~[id]~{${idSkin}}`, `~[undetected] skip`);

		return;
	}
	else if(skin && typeof skin == 'object') {
		skinNameFinal = skin.name;

		isBase = idSkin == 0;

		if(isBase) {
			skinNameFinal = `${D[I.id].title} ${D[I.id].name}`;
		}


		G.info('BINParser', `detect ~[id]~{${idSkin}}`, `~[skin]~{${skinNameFinal}}`);
	}
	else if(skin && typeof skin == 'number') {
		const chromas = D[I.id].skins[skin].chromas[idSkin];
		const stage = chromas.stage;

		if(stage) {
			skinNameFinal = chromas.name;

			G.info('BINParser', `detect ~[id]~{${idSkin}}`, `~[quest-skin]~{${skinNameFinal}}`);
		}
		else {
			G.info('BINParser', `detect ~[id]~{${idSkin}}`, `~[chroma] skip`);

			return;
		}
	}

	bifferBin.seek(0);

	let isFind = true;

	const setEventPoolName = new Set();

	while(isFind) {
		if(bifferBin.find([0x84, 0xE3, 0xD8, 0x12]) == -1) { break; }

		const [, , , , countEvent] = bifferBin.unpack('LBBLL');

		for(let i = 0; i < countEvent; i++) {
			const eventName = bifferBin.unpackString('H');

			if(eventName.indexOf('_sfx_') == -1) {
				let eventPoolName;
				let eventNameShort = [];

				if(eventName.startsWith('Play_vo_')) {
					[eventPoolName, ...eventNameShort] = eventName.replace('Play_vo_', '').split('_');
				}
				else if(eventName.indexOf('_vo_') > -1) {
					let action;
					[action, eventPoolName, ...eventNameShort] = eventName.replace('_vo_', '_').split('_');
					eventNameShort.unshift(action);
				}
				else if(eventName.startsWith('Play_')) {
					[eventPoolName, ...eventNameShort] = eventName.replace('Play_', '').split('_');
				}
				else if(eventName.startsWith('SetState_')) {
					let action;
					[action, eventPoolName, ...eventNameShort] = eventName.split('_');
					eventNameShort.unshift(action);
				}
				else {
					G.info('BINParser', `parse [event-name]`, `[Unkown]~{${eventName}}`);
				}

				setEventPoolName.add(eventPoolName);

				arrEvent.push({
					name: eventName,
					short: eventNameShort.join('_'),
					index: indexSkin,
					skinName: skinNameFinal.replace(/[\\/]/g, '') || `Skin${indexSkin}`,
					isBase,
				});
			}
		}
	}

	if(setEventPoolName.size > 1) { G.info('BINParser', '[EventPool]', `${[...setEventPoolName].join(', ')}`); }

	return arrEvent;
}
