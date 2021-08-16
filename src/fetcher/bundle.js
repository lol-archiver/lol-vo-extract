import { createHash } from 'crypto';
import { existsSync, readFileSync, resolve, writeFileSync } from 'fs';
import { join } from 'path';

import Axios from 'axios';

import { G, C } from '../../lib/global.js';


export default async function(id, version, cdn, counter) {
	const bid = ('0000000000000000' + id.toString(16)).slice(-16).toUpperCase();

	const pathBundle = join('./_cache/bundle', `${bid}.bundle`);

	let bufferBundle;
	if(existsSync(pathBundle)) {
		// L(`[Bundle-${bid}] cache exists, use cache.`);
		++counter.now;

		bufferBundle = readFileSync(pathBundle);
	}
	else {
		const bundleURL = resolve(cdn, `channels/public/bundles/${bid}.bundle`);

		// L(`[Bundle-${bid}] fetch from '${bundleURL}'`);

		let timesFetched = 0;
		let passFetched = false;

		while(timesFetched++ <= 4) {
			try {
				const { data, headers } = await Axios.get(bundleURL, { responseType: 'arraybuffer', proxy: C.server.proxy, timeout: 1000 * 60 * 4 });

				if(data.length != headers['content-length']) {
					G.error('BundleFetcher', `[${bid}] fetched, but length check failed, refetched, times: [${timesFetched}]`);
				}
				else {
					const hash = createHash('md5');
					hash.update(data);

					if(headers.etag.toLowerCase() != `"${hash.digest('hex')}"`.toLowerCase()) {
						G.error('BundleFetcher', `[${bid}] fetched, but etag check failed, refetched, times: [${timesFetched}]`);
					}
					else {
						passFetched = true;
					}
				}

				if(passFetched) {
					bufferBundle = data;

					G.info('BundleFetcher', `[${bid}] (${++counter.now}/${counter.max}) fetched, save at [${pathBundle}], size [${bufferBundle.length}]`);
					writeFileSync(pathBundle, bufferBundle);

					break;
				}
			}
			catch(error) {
				G.error('BundleFetcher', `[${bid}] fetch failed, ${error.message}, will refetch, times [${timesFetched}]`);
			}
		}

		if(!passFetched) {
			throw G.error('BundleFetcher', `[${bid}] fetch failed finally, over max fetch times`);
		}
	}

	return [bid, bufferBundle];
}