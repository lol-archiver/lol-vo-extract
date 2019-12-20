
module.exports = async function(bundleID, version, cdn) {
	let bid = ('0000000000000000' + bundleID.toString(16)).slice(-16).toUpperCase();

	let bundleLocal = _pa.join('./_cache/bundle', `${bid}.bundle`);
	let bundleBuffer;

	if(_fs.existsSync(bundleLocal)) {
		// L(`[Bundle-${bid}] cache exists, use cache.`);

		bundleBuffer = _fs.readFileSync(bundleLocal);
	}
	else {
		let bundleURL = _ul.resolve(cdn, `channels/public/bundles/${bid}.bundle`);

		L(`[Bundle-${bid}] fetch from '${bundleURL}'`);
		let { data } = await Axios.get(bundleURL, { responseType: 'arraybuffer', proxy: C.proxy || undefined });

		bundleBuffer = data;

		L(`[Bundle-${bid}] fetched, save at '${bundleLocal}', size ${bundleBuffer.length}`);
		_fs.writeFileSync(bundleLocal, bundleBuffer);
	}

	return [bid, bundleBuffer];
};