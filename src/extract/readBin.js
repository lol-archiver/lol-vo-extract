const skinIndexMap = require('../../data/skinIndex');

module.exports = function readBin(binPath, skinIndex) {
	const skinEvents = [];

	if(!_fs.existsSync(binPath)) { return; }

	L(`-------readBin ${_pa.parse(binPath).base}-------`);

	const binBiffer = Biffer(binPath);

	let skinNameFinal = null;
	let isBase = false;

	if(binBiffer.find([0xae, 0xf4, 0x77, 0xa9]) > -1) {
		const [skinID] = binBiffer.unpack('5xL');
		const skinInfo = skinIndexMap[skinID];

		// Chroma
		if(!skinInfo) {
			L(`[SkinID] ${skinID} is Undetected. Continue with SkinBinName`);
		}
		else if(skinInfo[0] == 3) {
			L(`[SkinID] ${skinID} is Chroma. Skip`);

			return;
		}
		else if(skinInfo[0] == 1 || skinInfo[0] == 2) {
			skinNameFinal = skinInfo[1];

			isBase = skinInfo[0] == 1;

			L(`[SkinID] ${skinID} is "${skinNameFinal}"`);
		}

	}
	binBiffer.seek(0);

	let isFind = true;

	while(isFind) {
		if(binBiffer.find([0x84, 0xE3, 0xD8, 0x12]) == -1) { break; }

		const [, , , , countEvent] = binBiffer.unpack('LBBLL');

		for(let i = 0; i < countEvent; i++) {
			const eventFull = binBiffer.unpackString('H');

			if(eventFull.indexOf('_sfx_') == -1) {
				let [, eventName] = eventFull.replace('Play_vo_', '').split('_');

				skinEvents.push({
					name: eventName,
					index: skinIndex,
					skinName: skinNameFinal || `Skin${skinIndex}`,
					full: eventFull,
					isBase,
				});
			}
		}
	}

	return skinEvents;
};