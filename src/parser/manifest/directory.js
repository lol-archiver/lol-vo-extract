const Directory = require('../../entry/manifest/Directory');

module.exports = async function parseDirectory(parser) {
	let [offset_table_offset] = parser.unpack('<l');
	let pos = parser.tell();

	// get offsets for directory and parent IDs
	parser.skip(-offset_table_offset);
	let [directoryIDOffset, parentIDOffset] = parser.unpack('<hh');
	parser.seek(pos);

	let [nameOffset] = parser.unpack('<l');
	// note: name is read later, at the end

	let directoryID = null;
	if(directoryIDOffset > 0) {
		[directoryID] = parser.unpack('<Q');
	}

	let parentID = null;
	if(parentIDOffset > 0) {
		[parentID] = parser.unpack('<Q');
	}

	parser.seek(pos + nameOffset);
	let name = parser.unpackString();

	return Directory(name, directoryID, parentID);
};