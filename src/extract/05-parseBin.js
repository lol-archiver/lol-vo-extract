import { existsSync } from 'fs';
import { parse } from 'path';

import { C, G } from '../../lib/global.js';
import Biffer from '../../lib/Biffer.js';
import baseData from '../../lib/BaseData.js';

const baseDataNow = baseData();

export default function parseBin(binPath, indexSkin) {
	if(!existsSync(binPath)) { return; }

	// G.info(`[parseBin] [${_pa.parse(binPath).base}]`);

	const binBiffer = new Biffer(binPath);

	const arrEvent = [];

	let skinNameFinal = null;
	let isBase = false;

	let idSkin;
	if(binBiffer.find([0xae, 0xf4, 0x77, 0xa9]) > -1) {
		[idSkin] = binBiffer.unpack('5xL');
		idSkin = ~~String(idSkin).substr(-3, 3);
	}
	else {
		const subID = parse(binPath).base.match(/\d+/)[0];
		// idSkin = `${C.id}${subID.padStart(3, '0')}`;
		idSkin = ~~subID;
	}

	const skin = baseDataNow[C.id].skins[idSkin];
	if(!skin) {
		if(binBiffer.findFromStart([0x48, 0x1c, 0x4b, 0x51]) > -1) {
			G.info(`\t[parseBin] Skin${idSkin} is Chroma, skip...`);

			return;
		}
		else if(binBiffer.findFromStart([0x80, 0x58, 0x22, 0x87]) > -1) {
			const [clazz] = binBiffer.unpack('5xB');

			if(clazz == 1) {
				skinNameFinal = idSkin;

				G.info(`\t[parseBin] Skin${idSkin} is Unknown-skin "${skinNameFinal}"`);
			}
			else if(clazz == 2) {
				G.info(`\t[parseBin] Skin${idSkin} is Chroma, skip...`);

				return;
			}
		}

		G.info(`\t[parseBin] Skin${idSkin} is Undetected. skip...`);

		return;
	}
	else if(skin && typeof skin == 'object') {
		skinNameFinal = skin.name;

		isBase = idSkin == 0;

		if(isBase) {
			skinNameFinal = `${baseDataNow[C.id].title} ${baseDataNow[C.id].name}`;
		}


		G.info(`\t[parseBin] Skin${idSkin} is Detected-skin "${skinNameFinal}"`);
	}
	else if(skin && typeof skin == 'number') {
		const chromas = baseDataNow[C.id].skins[skin].chromas[idSkin];
		const stage = chromas.stage;

		if(stage) {
			skinNameFinal = chromas.name;

			G.info(`\t[parseBin] Skin${idSkin} is Quest-skin "${skinNameFinal}"`);
		}
		else {
			G.info(`\t[parseBin] Skin${idSkin} is Chroma, skip...`);

			return;
		}
	}

	binBiffer.seek(0);

	let isFind = true;

	const setEventPoolName = new Set();

	while(isFind) {
		if(binBiffer.find([0x84, 0xE3, 0xD8, 0x12]) == -1) { break; }

		const [, , , , countEvent] = binBiffer.unpack('LBBLL');

		for(let i = 0; i < countEvent; i++) {
			const eventName = binBiffer.unpackString('H');

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
					G.info('Unkown Event Name Format', eventName);
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

	if(setEventPoolName.size > 1) { G.info(`\t[EventPool] ${[...setEventPoolName].join(', ')}`); }

	return arrEvent;
}