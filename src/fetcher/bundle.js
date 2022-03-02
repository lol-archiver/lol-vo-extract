import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import Axios from 'axios';
import joinURL from 'url-join';

import { G, C, TT } from '../../lib/global.js';


export default async function(id, version, cdn, counter) {
	const bid = ('0000000000000000' + id.toString(16)).slice(-16).toUpperCase();

	const pathBundle = join('./_cache/bundle', `${bid}.bundle`);

	let bufferBundle;
	if(existsSync(pathBundle)) {
		G.infoU(TT('fetchBundle:where'), TT('fetchBundle:doing', { bid, progess: `${++counter.now}/${counter.max}` }), TT('fetchBundle:cached'));

		bufferBundle = readFileSync(pathBundle);
	}
	else {
		G.infoU(TT('fetchBundle:where'), TT('fetchBundle:doing', { bid, progess: `${counter.now + 1}/${counter.max}` }), TT('fetchBundle:ing'));

		const bundleURL = joinURL(cdn, `channels/public/bundles/${bid}.bundle`);

		let timesFetched = 0;
		let passFetched = false;

		while(timesFetched++ <= 4) {
			try {
				const { data, headers } = await Axios.get(bundleURL, { responseType: 'arraybuffer', proxy: C.server.proxy, timeout: 1000 * 60 * 4 });

				if(data.length != headers['content-length']) {
					G.errorU(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), TT('fetchBundle:retry.contentLengthNotMatch', { remains: timesFetched }));
				}
				else {
					const hash = createHash('md5');
					hash.update(data);

					if(headers.etag.toLowerCase() != `"${hash.digest('hex')}"`.toLowerCase()) {
						G.errorU(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), TT('fetchBundle:retry.etagNotMatch', { remains: timesFetched }));
					}
					else {
						passFetched = true;
					}
				}

				if(passFetched) {
					bufferBundle = data;

					G.infoU(TT('fetchBundle:where'), TT('fetchBundle:doing', { bid, progess: `${++counter.now}/${counter.max}` }), TT('fetchBundle:ok'));
					writeFileSync(pathBundle, bufferBundle);

					break;
				}
			}
			catch(error) {
				G.errorU(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), error, TT('fetchBundle:retry.error', { remains: timesFetched }));
			}
		}

		if(!passFetched) {
			throw G.error(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), `failed finally. over max times`);
		}
	}

	return [bid, bufferBundle];
}