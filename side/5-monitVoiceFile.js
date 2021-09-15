import { posix, resolve } from 'path';
import { C, dirApp, G } from '../lib/global.js';
import Manifest from '../src/entry/manifest/Manifest.js';
import fetchEntry from '../src/fetcher/entry.js';
import fetchManifest from '../src/fetcher/manifest.js';
import BodyParser from '../src/parser/manifest/body.js';
import RmanParser from '../src/parser/manifest/rman.js';

const regexLang = /\.(zh_cn|en_us)\.wad\.client$/i;

(async () => {
	const [urlManifests, versionLatest] = await fetchEntry();

	const buffersManifest = await Promise.all(urlManifests.map((urlManifest) => fetchManifest(urlManifest, versionLatest)));

	const manifests = urlManifests.map((urlManifest, index) => new Manifest(urlManifest, versionLatest, buffersManifest[index]));

	await RmanParser(manifests);
	await BodyParser(manifests);

	const files = manifests.reduce((acc, manifest) => acc.concat(Object.values(manifest.files)), []);

	for(const file of files) {
		if(
			file.name.startsWith('DATA/FINAL/Champions/') &&
			regexLang.test(file.name)
		) {
			const base = posix.parse(file.name).base;

			G.infoU('VoiceFileMonitor', `Extract ~{${base}}`, '? ');
			await file.extract(versionLatest, C.server.cdn, resolve(dirApp, 'data', 'wad',base));
			G.infoD('VoiceFileMonitor', `Extract ~{${base}}`, '✔ ');
		}
	}
})();