import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import Axios from 'axios';
import joinURL from 'url-join';

import { G, C } from '../../lib/global.js';


export default async function(id, version, cdn, counter) {
	const bid = ('0000000000000000' + id.toString(16)).slice(-16).toUpperCase();

	const pathBundle = join('./_cache/bundle', `${bid}.bundle`);

	let bufferBundle;
	if(existsSync(pathBundle)) {
		G.infoU('BundleFetcher', `fetch bundle~{${bid}}~{${++counter.now}/${counter.max}}`, `cache founded`);

		bufferBundle = readFileSync(pathBundle);
	}
	else {
		G.infoU('BundleFetcher', `fetch bundle~{${bid}}~{${counter.now + 1}/${counter.max}}`, `? fetching...`);

		const bundleURL = joinURL(cdn, `channels/public/bundles/${bid}.bundle`);

		let timesFetched = 0;
		let passFetched = false;

		while(timesFetched++ <= 4) {
			try {
				const { data, headers } = await Axios.get(bundleURL, { responseType: 'arraybuffer', proxy: C.server.proxy, timeout: 1000 * 60 * 4 });

				if(data.length != headers['content-length']) {
					G.errorU('BundleFetcher', `fetch bundle~{${bid}}`, `content-length match failed. remains~{${timesFetched}}`);
				}
				else {
					const hash = createHash('md5');
					hash.update(data);

					if(headers.etag.toLowerCase() != `"${hash.digest('hex')}"`.toLowerCase()) {
						G.errorU('BundleFetcher', `fetch bundle~{${bid}}`, `etag match failed. remains~{${timesFetched}}`);
					}
					else {
						passFetched = true;
					}
				}

				if(passFetched) {
					bufferBundle = data;

					G.infoU('BundleFetcher', `fetch bundle~{${bid}}~{${++counter.now}/${counter.max}}`, `fetched`);
					writeFileSync(pathBundle, bufferBundle);

					break;
				}
			}
			catch(error) {
				G.errorU('BundleFetcher', `fetch bundle~{${bid}}`, error, `remains~{${timesFetched}}`);
			}
		}

		if(!passFetched) {
			throw G.error('BundleFetcher', `fetch bundle~{${bid}}`, `failed finally. over max times`);
		}
	}

	return [bid, bufferBundle];
}