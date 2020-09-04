const dataBase = require('../../data/BaseData/en_us.json');

module.exports = function parseBin(binPath, indexSkin) {
	if(!_fs.existsSync(binPath)) { return; }

	// L(`[parseBin] [${_pa.parse(binPath).base}]`);

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
		const subID = _pa.parse(binPath).base.match(/\d+/)[0];
		// idSkin = `${C.id}${subID.padStart(3, '0')}`;
		idSkin = ~~subID;
	}

	const skin = dataBase[C.id].skins[idSkin];
	if(!skin) {
		if(binBiffer.findFromStart([0x48, 0x1c, 0x4b, 0x51]) > -1) {
			L(`\t[parseBin] Skin${idSkin} is Chroma, skip...`);

			return;
		}
		else if(binBiffer.findFromStart([0x80, 0x58, 0x22, 0x87]) > -1) {
			const [clazz] = binBiffer.unpack('5xB');

			if(clazz == 1) {
				skinNameFinal = idSkin;

				L(`\t[parseBin] Skin${idSkin} is "Skin${skinNameFinal}"`);
			}
			else if(clazz == 2) {
				L(`\t[parseBin] Skin${idSkin} is Chroma, skip...`);

				return;
			}
		}

		L(`\t[parseBin] Skin${idSkin} is Undetected. skip...`);

		return;
	}
	else if(typeof skin == 'string') {
		L(`\t[parseBin] Skin${idSkin} is Chroma, skip...`);

		return;
	}
	else if(skin && typeof skin == 'object') {
		skinNameFinal = skin.name;

		isBase = idSkin == 0;

		L(`\t[parseBin] Skin${idSkin} is "${skinNameFinal}"`);
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
				else {
					L('Unkown Event Name Format');
				}

				setEventPoolName.add(eventPoolName);

				arrEvent.push({
					name: eventName,
					short: eventNameShort.join('_'),
					index: indexSkin,
					skinName: skinNameFinal || `Skin${indexSkin}`,
					isBase,
				});
			}
		}
	}

	if(setEventPoolName.size > 1) { L(`\t[EventPool] ${[...setEventPoolName].join(', ')}`); }

	return arrEvent;
};