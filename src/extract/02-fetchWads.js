import { parse } from 'path';

import joinURL from 'url-join';

import { C, G, TT } from '../../lib/global.js';

import fetchEntry from '../fetcher/entry.js';
import fetchManifest from '../fetcher/manifest.js';

import Manifest from '../entry/manifest/Manifest.js';


const detectManifest_Version = entry => {
	const releases = entry.releases.filter(release => release.release.labels.content.values[0] == C.server.statge);

	const versionLatest = C.server.version || Math.max(...releases.map(release => ~~release.release.labels['riot:revision'].values[0]));

	const urlsManifest = entry.releases
		.filter(release => release.release.labels['riot:revision'].values[0] == versionLatest)
		.map(release => release.download.url);

	return [urlsManifest, versionLatest];
};


export default async function fetchWADs(wadsNeedFetch) {
	if(!wadsNeedFetch.length) { return; }


	let urlsManifest;
	let versionLatest = 1;

	if(C.server.manifest) {
		urlsManifest = [joinURL(C.server.cdn, `channels/public/releases/${C.server.manifest}.manifest`)];

		G.info(TT('where:Main'), TT('fetchWADs:useLocal.do'), TT('fetchWADs:useLocal.ok', { manifest: C.server.manifest }));
	}
	else {
		[urlsManifest, versionLatest] = detectManifest_Version(await fetchEntry());

		G.info(TT('where:Main'), TT('fetchWADs:parseEntry.do'), TT('fetchWADs:parseEntry.ok', { version: versionLatest }),
			...urlsManifest.map(url => TT('fetchWADs:parseEntry.item', { name: parse(url).name }))
		);
	}


	const manifests = await Promise.all(urlsManifest.map(async url => {
		const id = parse(url).name;

		return new Manifest(url, versionLatest)
			.parse(await fetchManifest(id, url, `${versionLatest}-${id}.manifest`));
	}));


	/** @type {import('../entry/manifest/File.js').default[]} */
	const files = manifests.reduce((acc, manifest) => acc.concat(Object.values(manifest.files)), []);

	const filesFetched = [];
	for(const file of files) {
		for(const { name: nameFile, file: pathFile } of wadsNeedFetch) {
			if(file.name.toLowerCase().endsWith(nameFile)) {
				filesFetched.push(await file.extract(versionLatest, C.server.cdn, pathFile));

				break;
			}
		}
	}


	G.info(TT('where:Main'), TT('fetchWADs:do'), '✔ ');

	return filesFetched;
}