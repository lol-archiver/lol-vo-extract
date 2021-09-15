import { C, G } from '../../lib/global.js';

import fetchEntry from '../fetcher/entry.js';
import fetchManifest from '../fetcher/manifest.js';

import Manifest from '../entry/manifest/Manifest.js';

import RmanParser from '../parser/manifest/rman.js';
import BodyParser from '../parser/manifest/body.js';


export default async function fetchWads(wadsToFetch) {
	if(!wadsToFetch.length) { return; }

	const [urlManifests, versionLatest] = await fetchEntry();

	const buffersManifest = await Promise.all(urlManifests.map((urlManifest) => fetchManifest(urlManifest, versionLatest)));

	const manifests = urlManifests.map((urlManifest, index) => new Manifest(urlManifest, versionLatest, buffersManifest[index]));

	await RmanParser(manifests);
	await BodyParser(manifests);

	const files = manifests.reduce((acc, manifest) => acc.concat(Object.values(manifest.files)), []);

	// await files.find(file => file.name.toLowerCase().includes('Global.wad.client'.toLowerCase())).extract(versionLatest, C.server.cdn, 'D:/Desktop/Global.en_us.wad.client');

	const filesFetched = [];

	for(const file of files) {
		for(const [matchname, savePath] of wadsToFetch) {
			if(file.name.toLowerCase().endsWith(matchname)) {
				filesFetched.push(await file.extract(versionLatest, C.server.cdn, savePath));

				break;
			}
		}
	}

	G.info('WadFetcher', 'fetch and extract wads', '✔ ');

	return filesFetched;
}