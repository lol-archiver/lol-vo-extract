module.exports = function parserBin(binPath) {
	const events = [];
	const banks = [];

	if(!_fs.existsSync(binPath)) { return null; }

	L(`-------parserBin ${_pa.parse(binPath).base}-------`);

	const binBiffer = Biffer(binPath);

	if(binBiffer.find([0x80, 0x58, 0x22, 0x87]) == -1) { return null; }

	const [clazz] = binBiffer.unpack('4xxL');

	if(clazz != 1 && clazz != 2) { debugger; }
	if(clazz != 1) { return null; }

	let isFind = true;

	while(isFind) {
		if(binBiffer.find([0x00, 0xAD, 0x21, 0x2A]) == -1) { break; }

		const [, , , , countBanks] = binBiffer.unpack('LBBLL');

		for(let i = 0; i < countBanks; i++) {
			banks.push(binBiffer.unpackString('H'));
		}

		if(binBiffer.find([0x84, 0xE3, 0xD8, 0x12]) == -1) { break; }

		const [, , , , countEvent] = binBiffer.unpack('LBBLL');

		for(let i = 0; i < countEvent; i++) {
			events.push(binBiffer.unpackString('H'));
		}
	}

	return [banks, events];
};