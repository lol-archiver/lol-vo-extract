
module.exports = async function(id, version, cdn) {
	const bid = ('0000000000000000' + id.toString(16)).slice(-16).toUpperCase();

	const pathBundle = _pa.join('./_cache/bundle', `${bid}.bundle`);

	let bufferBundle;
	if(_fs.existsSync(pathBundle)) {
		// L(`[Bundle-${bid}] cache exists, use cache.`);

		bufferBundle = _fs.readFileSync(pathBundle);
	}
	else {
		const bundleURL = _ul.resolve(cdn, `channels/public/bundles/${bid}.bundle`);

		// L(`[Bundle-${bid}] fetch from '${bundleURL}'`);
		const { data } = await Axios.get(bundleURL, { responseType: 'arraybuffer', proxy: C.proxy || undefined });

		bufferBundle = data;

		L(`[Bundle-${bid}] fetched, save at '${pathBundle}', size ${bufferBundle.length}`);
		_fs.writeFileSync(pathBundle, bufferBundle);
	}

	return [bid, bufferBundle];
};