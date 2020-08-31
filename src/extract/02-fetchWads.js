const fetchEntry = require('../fetcher/entry');
const fetchManifest = require('../fetcher/manifest');

const parseRman = require('../parser/manifest/rman');
const parseBody = require('../parser/manifest/body');

const Manifest = require('../entry/manifest/Manifest');

Fex.ensureDirSync('./_cache/manifest');
Fex.ensureDirSync('./_cache/bundle');
Fex.ensureDirSync('./_cache/chunk');
Fex.ensureDirSync('./_cache/assets');

module.exports = async function fetchWads(wadsToFetch) {
	L(`[WadFetcher] Fetch wads from CDN`);

	const [urlManifests, versionLatest] = await fetchEntry(C.region, C.solution, C.sie);

	const buffersManifest = await Promise.all(urlManifests.map((urlManifest) => fetchManifest(urlManifest, versionLatest)));

	const manifests = urlManifests.map((urlManifest) => new Manifest(urlManifest, versionLatest));

	manifests.forEach((manifest, index) => manifest.buffer = buffersManifest[index]);
	await parseRman(manifests);
	await parseBody(manifests);

	const files = manifests.reduce((acc, manifest) => acc.concat(Object.values(manifest.files)), []);

	const filesFetched = [];

	for(const file of files) {
		for(const [matchname, savePath] of wadsToFetch) {
			if(file.name.toLowerCase().endsWith(matchname)) {
				filesFetched.push(await file.extract(versionLatest, C.cdn, savePath));

				break;
			}
		}
	}

	return filesFetched;
};