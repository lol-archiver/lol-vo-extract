export default function TableEntryParser(parser, typesKey) {
	const result = {};

	const posEntry = parser.tell();

	const posKey = posEntry - parser.unpack('<l')[0];
	parser.seek(posKey);

	parser.unpack(`<${typesKey.length}H`).forEach((offset, i) => {
		const entry = typesKey[i];

		if(entry == null) { return; }

		const [key, type] = entry;
		let value = null;

		if(!offset || !type) {
			value = null;
		}
		else {
			let pos = posEntry + offset;
			parser.seek(pos);

			if(type == 'offset') {
				value = pos;
			}
			else if(type == 'string') {
				let [offsetString] = parser.unpack('<l');

				parser.skip(offsetString - 4);
				value = parser.unpackString();
			}
			else {
				[value] = parser.unpack(type);
			}
		}

		result[key] = value;
	});

	return result;
}