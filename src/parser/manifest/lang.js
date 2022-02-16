import Lang from '../../entry/manifest/Lang.js';


export default function LangParser(parser) {
	parser.skip(4); // skip offset table offset
	let [langID, offset] = parser.unpack('<xxxBl');

	parser.skip(offset - 4);

	return new Lang(langID, parser.unpackString());
}