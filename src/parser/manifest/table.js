module.exports = async function parseTable(parser, entryParser) {
	let [count] = parser.unpack('<l');

	let list = [];

	for(let i = 0; i < count; i++) {
		if((i+1) % 1000 == 0 || i == count - 1 || i == 0) {
			L(`[${entryParser.name}] ${i+1}/${count}`);
		}

		let pos = parser.tell();
		let [offset] = parser.unpack('<l');

		parser.seek(pos + offset);

		list.push(await entryParser(parser));

		parser.seek(pos + 4);
	}

	return list;
};