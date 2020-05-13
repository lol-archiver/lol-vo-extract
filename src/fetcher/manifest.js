module.exports = async function(arrURLManifest, version) {
	const arrBufferManifest = [];

	for(const urlManifest of arrURLManifest) {
		const idManifest = _pa.parse(urlManifest).name;

		const fileCache = _pa.join('./_cache/manifest', `${version}-${idManifest}.manifest`);

		if(_fs.existsSync(fileCache)) {
			L(`[Manifest]${idManifest} cache exists, use cache.`);

			arrBufferManifest.push(_fs.readFileSync(fileCache));
		}
		else {
			L(`[Manifest]${idManifest} fetch from '${urlManifest}'`);

			const bufferManifest = (await Axios.get(urlManifest, { responseType: 'arraybuffer', proxy: C.proxy || undefined })).data;

			arrBufferManifest.push(bufferManifest);

			_fs.writeFileSync(fileCache, bufferManifest);

			L(`[Manifest]${idManifest} fetched, saved at '${fileCache}', size ${bufferManifest.length}`);
		}
	}

	return arrBufferManifest;
};