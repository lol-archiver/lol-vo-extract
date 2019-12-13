const Lang = require('../../entry/manifest/Lang');

module.exports = async function parserLang(parser) {
	parser.skip(4); // skip offset table offset
	let [langID, offset] = parser.unpack('<xxxBl');

	parser.skip(offset - 4);

	return Lang(langID, parser.unpackString());
};