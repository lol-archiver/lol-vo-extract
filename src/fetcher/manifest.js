module.exports = async function fetchManifest(urlManifest, version) {
	const idManifest = _pa.parse(urlManifest).name;

	const pathManifest = _pa.join('./_cache/manifest', `${version}-${idManifest}.manifest`);

	if(_fs.existsSync(pathManifest)) {
		L(`[fetchManifest] Manifest[${idManifest}] cache exists, use cache.`);

		return _fs.readFileSync(pathManifest);
	}
	else {
		L(`[fetchManifest] Manifest[${idManifest}] fetch from [${urlManifest}]`);

		const bufferManifest = (await Axios.get(urlManifest, { responseType: 'arraybuffer', proxy: C.proxy || undefined })).data;

		// bufferManifest.push(bufferManifest);

		_fs.writeFileSync(pathManifest, bufferManifest);

		LU(`[fetchManifest] Manifest[${idManifest}] fetched, saved at [${pathManifest}], size [${bufferManifest.length}]`);

		return bufferManifest;
	}
};