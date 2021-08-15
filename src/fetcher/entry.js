import URL from 'url';

import Axios from 'axios';

import { C, G } from '../../lib/global.js';


export default async function fetchEntry() {
	if(C.server.manifest) {
		G.info('EntryFetcher', 'detect', `manifest [${C.server.manifest}] version [${C.server.version || 1}]`);

		return [[URL.resolve(C.server.cdn, `channels/public/releases/${C.server.manifest}.manifest`)], C.server.version || 1];
	}

	const urlEntry = URL.resolve(C.server.sie, `/api/v1/products/lol/version-sets/${C.server.region}?q[artifact_type_id]=lol-game-client&q[platform]=windows`);

	G.info('EntryFetcher', `fetching...`);

	const { data } = await Axios.get(urlEntry, { proxy: C.server.proxy, timeout: 1000 * 60 * 4 });

	const content = C.server.region == 'PBE1' ? 'beta' : 'release';

	const releases = data.releases.filter(release => release.release.labels.content.values[0] == content);

	const versionLatest = C.server.version || Math.max(...releases.map(release => ~~release.release.labels['riot:revision'].values[0]));

	G.info('EntryFetcher', `latest [${content}] version [${versionLatest}]`);

	return [
		data.releases
			.filter(release => release.release.labels['riot:revision'].values[0] == versionLatest)
			.map(release => release.download.url),
		versionLatest
	];
}