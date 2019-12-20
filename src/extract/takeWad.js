Fex.ensureDirSync('./_cache/extract');

module.exports = async function takeWad(wadPath, takeMap) {
	L(`-------takeWad ${_pa.parse(wadPath).base}-------`);

	const wadBiffer = Biffer(wadPath);

	// eslint-disable-next-line no-unused-vars
	const [magic, versionMajor, versionMinor] = wadBiffer.unpack("2sBB");

	if(versionMajor == 1) {
		wadBiffer.seek(8);
	}
	else if(versionMajor == 2) {
		wadBiffer.seek(100);
	}
	else if(versionMajor == 3) {
		wadBiffer.seek(268);
	}

	const [entryCount] = wadBiffer.unpack("I");
	const takeFiles = [];

	for(let i = 0; i < entryCount; i++) {
		// eslint-disable-next-line no-unused-vars
		let hash, offset, size, type, compressedSize, duplicate, sha256;

		if(versionMajor == 1) {
			[hash, offset, compressedSize, size, type] = wadBiffer.unpack("QIIII");
		}
		else {
			[hash, offset, compressedSize, size, type, duplicate, , , sha256] = wadBiffer.unpack("QIIIBBBBQ");
		}

		const saveName = takeMap[hash];
		if(saveName) {
			const fileBuffer = wadBiffer.buffer.slice(offset, offset + compressedSize);

			const pathSave = RD('_cache', 'extract', saveName);

			takeFiles.push(saveName);

			if(type == 0) {
				_fs.writeFileSync(pathSave, fileBuffer);
			}
			else if(type == 1) {
				_fs.writeFileSync(pathSave, await Gzip.ungzip(fileBuffer));
			}
			else if(type == 2) {
				throw 'unused extract';
				// const [n] = Biffer(fileBuffer).unpack('L');
				// target = data[4: 4 + n].rstrip(b'\0').decode('utf-8')
			}
			else if(type == 3) {
				await T.unZstd(pathSave, fileBuffer);
			}
		}
	}

	return takeFiles;
};