const fetchEntry = require('../fetcher/entry');
const fetchManifest = require('../fetcher/manifest');

const parseRman = require('../parser/manifest/rman');
const parseBody = require('../parser/manifest/body');

const Manifest = require('../entry/manifest/Manifest');

Fex.ensureDirSync('./_cache/manifest');
Fex.ensureDirSync('./_cache/bundle');
Fex.ensureDirSync('./_cache/chunk');
Fex.ensureDirSync('./_cache/assets');

module.exports = async function Downloader(files) {
	L(`[Progress][1/4] -------Download-------`);

	let [maniURL, version] = await fetchEntry(C.channel, C.solution, C.cdn);

	let maniBuffer = await fetchManifest(maniURL, version);

	let manifest = Manifest(maniURL, version, C.cdn);

	let bodyBuffer = await parseRman(manifest, maniBuffer);
	await parseBody(manifest, bodyBuffer);

	const fileEntries = Object.values(manifest.files).filter(({ name: path }) => files.filter(filename => path.toLowerCase().endsWith(filename)).length);

	for(let file of fileEntries) {
		await file.extract(manifest.version, manifest.cdn);
	}

	return version;
};