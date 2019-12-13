const Bundle = require('../../entry/manifest/Bundle');

module.exports = async function parserBundle(parser) {
	let [, n, bundleID] = parser.unpack('<llQ');

	// skip remaining header part, if any
	parser.skip(n - 12);

	let bundle = Bundle(bundleID);

	[n] = parser.unpack('<l');

	for(let i = 0; i < n; i++) {
		let pos = parser.tell();
		let [offset] = parser.unpack('<l');

		parser.seek(pos + offset);
		parser.skip(4); // skip offset table offset

		let [compressedSize, uncompressedSize, chunkID] = parser.unpack('<LLQ');

		bundle.addChunk(chunkID, compressedSize, uncompressedSize);
		parser.seek(pos + 4);
	}

	return bundle;
};