module.exports = async function(manifestURL, version) {
	let maniLocal = _pa.join('./_cache/manifest', `${version}-${_pa.parse(manifestURL).base}`);
	let maniBuffer;

	if(_fs.existsSync(maniLocal)) {
		L('[Manifest] cache exists, use cache.');

		maniBuffer = _fs.readFileSync(maniLocal);
	}
	else {
		L(`[Manifest] fetch from '${manifestURL}'`);
		maniBuffer = (await Axios.get(manifestURL, { responseType: 'arraybuffer', proxy: C.proxy || undefined })).data;

		L(`[Manifest] fetched, save at '${maniLocal}', size ${maniBuffer.length}`);
		_fs.writeFileSync(maniLocal, maniBuffer);
	}

	return maniBuffer;
};