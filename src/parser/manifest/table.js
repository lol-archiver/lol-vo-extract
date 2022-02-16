import { G } from '../../../lib/global.js';


export default function TableParser(biffer, parserItem) {
	const [count] = biffer.unpack('<l');

	const items = [];

	for(let i = 1; i <= count; i++) {
		if(i % 1000 == 0 || i == count || i == 1) {
			G.infoU('TableParser', `${parserItem.name}~{${i}/${count}}`, `parsing...`);
		}

		const pos = biffer.tell();
		const [offset] = biffer.unpack('<l');

		biffer.seek(pos + offset);

		items.push(parserItem(biffer, i));

		biffer.seek(pos + 4);
	}

	G.infoD('TableParser', parserItem.name, '✔ ');

	return items;
}