module.exports = function parserBin(binPath, skinIndex) {
	const events = [];

	if(!_fs.existsSync(binPath)) { return events; }

	L(`-------parserBin ${_pa.parse(binPath).base}-------`);

	const binBiffer = Biffer(binPath);

	const offset = binBiffer.buffer.indexOf(Buffer.from([0x84, 0xE3, 0xD8, 0x12]));

	if(offset == -1) { return events; }

	binBiffer.seek(offset);

	const [, , , , count] = binBiffer.unpack('LBBLL');

	for(let i = 0; i < count; i++) {
		events.push([skinIndex, binBiffer.unpackString('H')]);
	}

	return events;
};