const fetchEntry = require('../fetcher/entry');
const fetchManifest = require('../fetcher/manifest');

const parseRman = require('../parser/manifest/rman');
const parseBody = require('../parser/manifest/body');

const Manifest = require('../entry/manifest/Manifest');

Fex.ensureDirSync('./_cache/manifest');
Fex.ensureDirSync('./_cache/bundle');
Fex.ensureDirSync('./_cache/chunk');
Fex.ensureDirSync('./_cache/assets');

module.exports = async function FetchWad(files) {
	L(`-------FetchWad-------`);

	let [maniURL, version] = await fetchEntry(C.channel, C.solution, C.cdn);

	let maniBuffer = await fetchManifest(maniURL, version);

	let manifest = Manifest(maniURL, version, C.cdn);

	let bodyBuffer = await parseRman(manifest, maniBuffer);
	await parseBody(manifest, bodyBuffer);

	let result = [];

	for(let file of Object.values(manifest.files)) {
		for(let [matchname, savePath] of files) {
			if(file.name.toLowerCase().endsWith(matchname)) {
				result.push(await file.extract(manifest.version, manifest.cdn, savePath));

				break;
			}
		}
	}

	return result;
};