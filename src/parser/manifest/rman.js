module.exports = async function parseRman(manifest, buffer) {
	let parser = Biffer(buffer);

	let [magic, versionMajor, versionMinor] = parser.unpack('<4sBB');

	if(magic != 'RMAN') {
		throw 'invalid magic code';
	}

	if(versionMajor != 2 || versionMinor != 0) {
		throw `unsupported RMAN version: ${versionMajor}.${versionMinor}`;
	}

	let [flags, offset, length, manifestId, bodyLength] = parser.unpack("<HLLQL");

	_as(flags & (1 << 9));
	_as(offset == parser.tell());

	manifest.id = manifestId;

	return await T.unZstd(`./_cache/manifest/${manifest.version}-body.manifest`, parser.raw(length), true);
};