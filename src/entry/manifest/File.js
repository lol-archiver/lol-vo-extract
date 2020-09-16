const fetchBundle = require('../../fetcher/bundle');

const pathCacheZstd = RD('_cache', 'zstd');

const Bluebird = require('bluebird');

module.exports = class File {
	constructor(id, name, sizeFile, link, langs, fileChunks, version) {
		this.id = id;
		this.name = name;
		this.sizeFile = sizeFile;
		this.link = link;
		this.langs = langs;
		this.fileChunks = fileChunks;
		this.version = version;
	}

	async extract(version, cdn, pathSave) {
		const setIDBundle = new Set();

		this.fileChunks.forEach(chunk => setIDBundle.add(chunk.idBundle));

		L(`[File] ${this.name} length ${setIDBundle.size}`);

		const bundleBuffer = {};

		const promises = [];
		const counter = { now: 0, max: setIDBundle.size };
		for(const idBundle of setIDBundle) {
			promises.push(fetchBundle(idBundle, version, cdn, counter).then(([bid, buffer]) => bundleBuffer[bid] = buffer));
		}
		await Bluebird.map(promises, r => r, { concurrency: 45 });

		L(`[File] ${this.name} AllFetched, UnZstding...`);

		Fex.ensureDirSync(_pa.parse(pathSave).dir);
		Fex.removeSync(pathSave);
		Fex.removeSync(pathCacheZstd);

		for(const chunk of this.fileChunks) {
			const bid = ('0000000000000000' + chunk.idBundle.toString(16)).slice(-16).toUpperCase();

			const parser = new Biffer(bundleBuffer[bid]);

			parser.seek(chunk.offset);

			Fex.appendFileSync(pathCacheZstd, parser.raw(chunk.size));
		}

		return new Promise((resolve, reject) => Zstd.decompress(pathCacheZstd, pathSave, err => err ? reject(err) : resolve(pathSave)));
	}
};