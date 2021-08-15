import Bundle from '../../entry/manifest/Bundle';


export default function parserBundle(biffer) {
	const [, sizeHeader, id] = biffer.unpack('<llQ');

	// Skip remaining header part
	biffer.skip(sizeHeader - 12);

	const bundle = new Bundle(id);

	const [sizeChunk] = biffer.unpack('<l');
	for(let i = 0; i < sizeChunk; i++) {
		const pos = biffer.tell();
		const [offset] = biffer.unpack('<l');

		biffer.seek(pos + offset);
		biffer.skip(4); // skip offset table offset

		const [sizeCompressed, sizeUncompressed, idChunk] = biffer.unpack('<LLQ');

		bundle.addChunk(idChunk, sizeCompressed, sizeUncompressed);

		biffer.seek(pos + 4);
	}

	return bundle;
}