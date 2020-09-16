
module.exports = async function(id, version, cdn, counter) {
	const bid = ('0000000000000000' + id.toString(16)).slice(-16).toUpperCase();

	const pathBundle = _pa.join('./_cache/bundle', `${bid}.bundle`);

	let bufferBundle;
	if(_fs.existsSync(pathBundle)) {
		// L(`[Bundle-${bid}] cache exists, use cache.`);
		++counter.now;

		bufferBundle = _fs.readFileSync(pathBundle);
	}
	else {
		const bundleURL = _ul.resolve(cdn, `channels/public/bundles/${bid}.bundle`);

		// L(`[Bundle-${bid}] fetch from '${bundleURL}'`);

		let timesFetched = 0;
		let passFetched = false;

		while(timesFetched++ <= 4) {
			try {
				const { data, headers } = await Axios.get(bundleURL, { responseType: 'arraybuffer', proxy: C.proxy || undefined });

				if(data.length != headers['content-length']) {
					L(`[Bundle-${bid}] fetched, but length check failed, refetched, times: ${timesFetched}`);
				}
				else {
					const hash = _cr.createHash('md5');
					hash.update(data);

					if(headers.etag.toLowerCase() != `"${hash.digest('hex')}"`.toLowerCase()) {
						L(`[Bundle-${bid}] fetched, but etag check failed, refetched, times: ${timesFetched}`);
					}
					else {
						passFetched = true;
					}
				}

				if(passFetched) {
					bufferBundle = data;

					L(`[Bundle-${bid}] (${++counter.now}/${counter.max}) fetched, save at '${pathBundle}', size ${bufferBundle.length}`);
					_fs.writeFileSync(pathBundle, bufferBundle);

					break;
				}
			}
			catch(error) {
				L(`[Bundle-${bid}] fetch failed, ${error.message}, refetched, times: ${timesFetched}`);
			}
		}

		if(!passFetched) {
			throw L(`[Bundle-${bid}] fetch failed finally, over max fetch times`);
		}
	}

	return [bid, bufferBundle];
};