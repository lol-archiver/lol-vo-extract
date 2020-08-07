const Directory = require('../../entry/manifest/Directory');

module.exports = async function parseDirectory(parser) {
	const [offset_table_offset] = parser.unpack('<l');
	const pos = parser.tell();

	// get offsets for directory and parent IDs
	parser.skip(-offset_table_offset);
	const [idOffset, parentIDOffset] = parser.unpack('<hh');
	parser.seek(pos);

	const [nameOffset] = parser.unpack('<l');
	// note: name is read later, at the end

	let id = null;
	if(idOffset > 0) {
		[id] = parser.unpack('<Q');
	}

	let parentID = null;
	if(parentIDOffset > 0) {
		[parentID] = parser.unpack('<Q');
	}

	parser.seek(pos + nameOffset);
	const name = parser.unpackString();

	return new Directory(id, name, parentID);
};