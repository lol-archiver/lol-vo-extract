module.exports = async function parseTable(biffer, parserItem) {
	const [count] = biffer.unpack('<l');

	const items = [];

	for(let i = 1; i <= count; i++) {
		if(i % 1000 == 0 || i == count || i == 1) {
			LU(`[${parserItem.name}] ${i}/${count}`);
		}

		const pos = biffer.tell();
		const [offset] = biffer.unpack('<l');

		biffer.seek(pos + offset);

		items.push(await parserItem(biffer));

		biffer.seek(pos + 4);
	}

	return items;
};