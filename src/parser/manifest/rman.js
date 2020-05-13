module.exports = async function parseRman(arrManifestTemp) {
	for(const manifestTemp of arrManifestTemp) {
		const [manifest, bufferFull] = manifestTemp;
		const parser = Biffer(bufferFull);

		const [magic, versionMajor, versionMinor] = parser.unpack('<4sBB');

		if(magic != 'RMAN') { throw 'invalid magic code'; }
		if(versionMajor != 2 || versionMinor != 0) { throw `unsupported RMAN version: ${versionMajor}.${versionMinor}`; }

		// eslint-disable-next-line no-unused-vars
		const [flags, offset, length, manifestId, bodyLength] = parser.unpack("<HLLQL");

		_as(flags & (1 << 9));
		_as(offset == parser.tell());

		manifest.id = manifestId;

		manifestTemp[1] = await T.unZstd(`./_cache/manifest/${manifest.version}-${manifest.id}-body.manifest`, parser.raw(length), true);
	}
};