const File = require('../../entry/manifest/File');

const parseTable = require('./table');
const parseBundle = require('./bundle');
const parseLang = require('./lang');
const parseFileEntry = require('./fileEntry');
const parseDirectory = require('./Directory');

module.exports = async function parseBody(manifest, buffer) {
	let parser = Biffer(buffer);

	// header (unknown values, skip it)
	let [n] = parser.unpack('<l');
	parser.skip(n);

	// offsets to tables(convert to absolute)
	let offsetsBase = parser.tell();
	let d = parser.unpack('<6l');
	let offsets = d.map((v, i) => offsetsBase + 4 * i + v);

	parser.seek(offsets[0]);
	manifest.bundles = await parseTable(parser, parseBundle);

	parser.seek(offsets[1]);

	manifest.langs = {};
	(await parseTable(parser, parseLang)).forEach(lang => manifest.langs[lang.langID] = lang.lang);

	// build a list of chunks, indexed by ID
	manifest.chunks = {};
	for(let bundle of manifest.bundles) {
		for(let chunk of bundle.chunks) {
			manifest.chunks[chunk.chunkID] = chunk;
			chunk.bundleID = bundle.bundleID;
			delete chunk.bundle;
		}
	}

	parser.seek(offsets[2]);

	manifest.fileEntries = await parseTable(parser, parseFileEntry);

	parser.seek(offsets[3]);

	let folder = await parseTable(parser, parseDirectory);
	let directories = {};
	for(let dir of folder) {
		directories[dir.directoryID] = dir;
	}

	// merge files and directory data
	let files = {};
	for(let f of manifest.fileEntries) {
		let { name, link, langIDs, directoryID, fileSize, chunkIDs } = f;

		while(directoryID) {
			let directory = directories[directoryID] || {};

			let dirName = directory.name;
			directoryID = directory.parentID;

			name = `${dirName}/${name}`;
		}

		let langs = (langIDs || []).map(id => manifest.langs[id]);
		let fileChunks = (chunkIDs || []).map(id => manifest.chunks[id]);

		files[name] = File(name, fileSize, link, langs, fileChunks, manifest.version);
	}

	manifest.files = files;
};