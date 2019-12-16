module.exports = async function unzipkWpk(wpkPath) {
	const wpkBiffuer = Biffer(wpkPath);

	// eslint-disable-next-line no-unused-vars
	const [magic, version, count] = wpkBiffuer.unpack("4sLL");

	const headerOffsets = wpkBiffuer.unpack(`${count}L`);

	for(const headerOffset of headerOffsets) {
		wpkBiffuer.seek(headerOffset);

		const [offset, size, nameLength] = wpkBiffuer.unpack('LLL');
		const name = Buffer.from([...wpkBiffuer.raw(nameLength * 2)].filter(byte => byte)).toString('utf8');

		_fs.writeFileSync(RD('_cache', 'sound', 'wem', name), wpkBiffuer.buffer.slice(offset, offset + size));
	}
};