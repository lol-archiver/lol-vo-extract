import URL from 'url';

import Axios from 'axios';

import { G } from '../../lib/global.js';


export default async function fetchEntry({ region, cdn, sie, manifest, version, proxy } = {}) {
	if(manifest) {
		G.info('EntryFetcher', 'detect', `manifest [${manifest}] version [${version || 1}]`);

		return [[URL.resolve(cdn, `channels/public/releases/${manifest}.manifest`)], version || 1];
	}

	const urlEntry = URL.resolve(sie, `/api/v1/products/lol/version-sets/${region}?q[artifact_type_id]=lol-game-client&q[platform]=windows`);

	G.info('EntryFetcher', `fetching...`);

	const { data } = await Axios.get(urlEntry, { proxy: proxy || undefined, timeout: 1000 * 60 * 4 });

	const content = region == 'PBE1' ? 'beta' : 'release';

	const releases = data.releases.filter(release => release.release.labels.content.values[0] == content);

	const versionLatest = version || Math.max(...releases.map(release => ~~release.release.labels['riot:revision'].values[0]));

	G.info('EntryFetcher', `latest [${content}] version [${versionLatest}]`);

	return [
		data.releases
			.filter(release => release.release.labels['riot:revision'].values[0] == versionLatest)
			.map(release => release.download.url),
		versionLatest
	];
}