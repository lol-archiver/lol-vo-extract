module.exports = function readBin(binPath, skinIndex) {
	const skinEvents = [];

	if(!_fs.existsSync(binPath)) { return; }

	L(`-------readBin ${_pa.parse(binPath).base}-------`);

	const binBiffer = Biffer(binPath);

	if(binBiffer.find([0x2d, 0x66, 0x5a, 0x8d]) > -1) { L('Chroma'); }
	binBiffer.seek(0);

	if(binBiffer.find([0xae, 0xf4, 0x77, 0xa9]) > -1) {
		const [skinID] = binBiffer.unpack('5xL');

		L(`[SkinID] ${skinID}`);
	}
	binBiffer.seek(0);

	// Legacy Skin
	if(!C.legacySkin && binBiffer.find([0xeb, 0xbd, 0xdd, 0x2d, 0x01, 0x01]) > -1) {
		L('[WARNING] Legacy Skin');

		return;
	}



	let isFind = true;

	while(isFind) {

		// if(binBiffer.find([0x00, 0xAD, 0x21, 0x2A]) == -1) { break; }

		// const [, , , , countBanks] = binBiffer.unpack('LBBLL');

		// for(let i = 0; i < countBanks; i++) {
		// 	const bank = binBiffer.unpackString('H');

		// 	if(bank.indexOf('/SFX/') > -1) { continue find; }

		// 	voice.banks.push(bank);
		// }

		if(binBiffer.find([0x84, 0xE3, 0xD8, 0x12]) == -1) { break; }

		const [, , , , countEvent] = binBiffer.unpack('LBBLL');

		for(let i = 0; i < countEvent; i++) {
			const event = binBiffer.unpackString('H');

			if(event.indexOf('_sfx_') == -1) {
				skinEvents.push(event);
			}
		}
	}

	return skinEvents;
};