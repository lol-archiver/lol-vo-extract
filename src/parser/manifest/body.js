const File = require('../../entry/manifest/File');

const parseTable = require('./table');
const parseBundle = require('./bundle');
const parseLang = require('./lang');
const parseFileEntry = require('./fileEntry');
const parseDirectory = require('./Directory');

module.exports = async function parseBody(arrManifestTemp) {
	for(const [manifest, buffer] of arrManifestTemp) {
		const parser = Biffer(buffer);

		// header (unknown values, skip it)
		const [n] = parser.unpack('<l');
		parser.skip(n);

		// offsets to tables(convert to absolute)
		const offsetsBase = parser.tell();
		const d = parser.unpack('<6l');
		const offsets = d.map((v, i) => offsetsBase + 4 * i + v);

		parser.seek(offsets[0]);
		manifest.bundles = await parseTable(parser, parseBundle);

		parser.seek(offsets[1]);

		manifest.langs = {};
		(await parseTable(parser, parseLang)).forEach(lang => manifest.langs[lang.langID] = lang.lang);

		// build a list of chunks, indexed by ID
		manifest.chunks = {};
		for(const bundle of manifest.bundles) {
			for(const chunk of bundle.chunks) {
				manifest.chunks[chunk.chunkID] = chunk;
				chunk.bundleID = bundle.bundleID;
				delete chunk.bundle;
			}
		}

		parser.seek(offsets[2]);

		manifest.fileEntries = await parseTable(parser, parseFileEntry);

		parser.seek(offsets[3]);

		const folder = await parseTable(parser, parseDirectory);
		const directories = {};
		for(const dir of folder) {
			directories[dir.directoryID] = dir;
		}

		// merge files and directory data
		const files = {};
		for(const f of manifest.fileEntries) {
			const { link, langIDs, fileSize, chunkIDs } = f;
			let { name, directoryID } = f;

			while(directoryID) {
				const directory = directories[directoryID] || {};

				const dirName = directory.name;
				directoryID = directory.parentID;

				name = `${dirName}/${name}`;
			}

			const langs = (langIDs || []).map(id => manifest.langs[id]);
			const fileChunks = (chunkIDs || []).map(id => manifest.chunks[id]);

			files[name] = File(name, fileSize, link, langs, fileChunks, manifest.version);
		}

		manifest.files = files;
	}
};