const fetchEntry = require('../fetcher/entry');
const fetchManifest = require('../fetcher/manifest');

const parseRman = require('../parser/manifest/rman');
const parseBody = require('../parser/manifest/body');

const Manifest = require('../entry/manifest/Manifest');

Fex.ensureDirSync('./_cache/manifest');
Fex.ensureDirSync('./_cache/bundle');
Fex.ensureDirSync('./_cache/chunk');
Fex.ensureDirSync('./_cache/assets');

module.exports = async function downWad(files) {
	L(`[Main] Download Wad from CDN`);

	const [arrURLManifest, version] = await fetchEntry(C.region, C.solution, C.sie);

	const arrBufferManifest = await fetchManifest(arrURLManifest, version);

	const arrManifest = arrURLManifest.map((urlManifest) => Manifest(urlManifest, version));
	const arrManifestTemp = arrManifest.map((manifest, index) => [manifest, arrBufferManifest[index]]);

	await parseRman(arrManifestTemp);
	await parseBody(arrManifestTemp);

	const arrFetchedFile = [];
	const arrFilesAll = arrManifest.reduce((acc, manifest) => acc.concat(Object.values(manifest.files)), []);

	for(const file of arrFilesAll) {
		for(const [matchname, savePath] of files) {
			if(file.name.toLowerCase().endsWith(matchname)) {
				arrFetchedFile.push(await file.extract(version, C.cdn, savePath));

				break;
			}
		}
	}

	return arrFetchedFile;
};