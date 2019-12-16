module.exports = function readBin(binPath, skinIndex) {
	const skinEvents = { id: skinIndex, events: [] };

	if(!_fs.existsSync(binPath)) { return null; }

	L(`-------readBin ${_pa.parse(binPath).base}-------`);

	const binBiffer = Biffer(binPath);

	if(binBiffer.find([0x80, 0x58, 0x22, 0x87]) == -1) { return null; }

	const [clazz] = binBiffer.unpack('4xxL');

	if(clazz != 1 && clazz != 2) { L(`[WARNING] Unknown Bin Class`); }
	if(clazz != 1) { return null; }

	let isFind = true;

	while(isFind) {

		if(binBiffer.find([0x00, 0xAD, 0x21, 0x2A]) == -1) { break; }

		// const [, , , , countBanks] = binBiffer.unpack('LBBLL');

		// for(let i = 0; i < countBanks; i++) {
		// 	const bank = binBiffer.unpackString('H');

		// 	if(bank.indexOf('/SFX/') > -1) { continue find; }

		// 	voice.banks.push(bank);
		// }

		if(binBiffer.find([0x84, 0xE3, 0xD8, 0x12]) == -1) { L('why'); break; }

		const [, , , , countEvent] = binBiffer.unpack('LBBLL');

		for(let i = 0; i < countEvent; i++) {
			const event = binBiffer.unpackString('H');

			if(event.indexOf('_sfx_') == -1) {
				skinEvents.events.push(event);
			}
		}
	}

	return skinEvents;
};