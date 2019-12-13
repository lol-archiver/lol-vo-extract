const FileEntry = require('../../entry/manifest/FileEntry');

module.exports = async function parserFileEntry(parser) {
	parser.skip(4); // skip offset table offset
	let pos = parser.tell();

	let [flags] = parser.unpack('<L');

	let nameOffset;
	if(flags == 0x00010200 || (flags >> 24) != 0) {
		[nameOffset] = parser.unpack('<l');
	}
	else {
		nameOffset = flags - 4;
		flags = 0;
	}

	let [structSize, linkOffset, fileID] = parser.unpack('<llQ');
	// note: name and linkOffset are read later, at the end

	let directoryID = null;
	if(structSize > 28) {
		[directoryID] = parser.unpack('<Q');
	}

	let [fileSize] = parser.unpack('<LL');

	let langMask;
	let langIDs = [];
	if(structSize > 36) {
		[langMask] = parser.unpack('<Q');

		for(let i = 0; i < 64; i++) {
			if(langMask & (BigInt(1) << BigInt(i))) {
				langIDs.push(i + 1);
			}
		}
	}
	else {
		langIDs = null;
	}

	let [, chunkCount] = parser.unpack('<LL');
	let chunkIDs = parser.unpack(`${chunkCount}Q`);

	parser.seek(pos + 4 + nameOffset);
	let name = parser.unpackString();
	parser.seek(pos + 12 + linkOffset);
	let link = parser.unpackString();
	if(!link) {
		link = null;
	}

	return FileEntry(flags, name, link, langIDs, directoryID, fileSize, chunkIDs);
};