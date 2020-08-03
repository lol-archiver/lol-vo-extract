const skinIndexMap = require('../../data/skinIndex');

module.exports = function readBin(binPath, indexSkin) {
	if(!_fs.existsSync(binPath)) { return; }

	L(`[Main] Read Bin [${_pa.parse(binPath).base}]`);

	const binBiffer = Biffer(binPath);

	const arrEvent = [];

	let skinNameFinal = null;
	let isBase = false;

	let skinID;
	if(binBiffer.find([0xae, 0xf4, 0x77, 0xa9]) > -1) {
		[skinID] = binBiffer.unpack('5xL');

	}
	else {
		const subID = _pa.parse(binPath).base.match(/\d+/)[0];
		skinID = `${C.id}${subID.padStart(3, '0')}`;
	}

	const skinInfo = skinIndexMap[skinID];
	if(!skinInfo) {
		if(binBiffer.findFromStart([0x48, 0x1c, 0x4b, 0x51]) > -1) {
			L(`\t[SkinID] ${skinID} is Chroma, skip...`);

			return;
		}
		else if(binBiffer.findFromStart([0x80, 0x58, 0x22, 0x87]) > -1) {
			const [clazz] = binBiffer.unpack('5xB');

			if(clazz == 1) {
				skinNameFinal = skinID;

				L(`\t[SkinID] ${skinID} is "Skin${skinNameFinal}"`);
			}
			else if(clazz == 2) {
				L(`\t[SkinID] ${skinID} is Chroma, skip...`);

				return;
			}
		}

		L(`\t[SkinID] ${skinID} is Undetected. skip...`);

		return;
	}
	else if(skinInfo[0] == 3) {
		L(`\t[SkinID] ${skinID} is Chroma, skip...`);

		return;
	}
	else if(skinInfo[0] == 1 || skinInfo[0] == 2) {
		skinNameFinal = skinInfo[1];

		isBase = skinInfo[0] == 1;

		L(`\t[SkinID] ${skinID} is "${skinNameFinal}"`);
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