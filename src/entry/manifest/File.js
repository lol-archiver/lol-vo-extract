const fetchBundle = require('../../fetcher/bundle');

const pathCacheZstd = RD('_cache', 'zstd');

module.exports = function File(name, fileSize, link, langs, fileChunks, version) {
	if(!(this instanceof File)) {
		return new File(...arguments);
	}

	this.name = name;
	this.fileSize = fileSize;
	this.link = link;
	this.langs = langs;
	this.fileChunks = fileChunks;
	this.version = version;

	this.extract = async function(version, cdn, pathSave) {
		const bundleIDSet = new Set();

		this.fileChunks.forEach(chunk => bundleIDSet.add(chunk.bundleID));

		L(`[File] ${this.name} length ${bundleIDSet.size}`);

		const bundleBuffer = {};

		const promises = [];
		for(const bundleID of bundleIDSet) {
			promises.push(fetchBundle(bundleID, version, cdn).then(([bid, buffer]) => bundleBuffer[bid] = buffer));
		}
		await Promise.all(promises);

		// for(const bundleID of bundleIDSet) {
		// 	const [bid, buffer] = await fetchBundle(bundleID, version, cdn);

		// 	bundleBuffer[bid] = buffer;
		// }

		L(`[File] ${this.name} AllFetched, UnZstding...`);

		Fex.ensureDirSync(_pa.parse(pathSave).dir);
		Fex.removeSync(pathSave);
		Fex.removeSync(pathCacheZstd);

		for(const chunk of this.fileChunks) {
			const bid = ('0000000000000000' + chunk.bundleID.toString(16)).slice(-16).toUpperCase();

			const parser = Biffer(bundleBuffer[bid]);

			parser.seek(chunk.offset);

			// const chunkBuffer = await T.unZstd(_pa.join('./_cache/chunk', `${chunk.chunkID}.chunk`), parser.raw(chunk.size), true);

			Fex.appendFileSync(pathCacheZstd, parser.raw(chunk.size));
		}

		return await new Promise((resolve, reject) => Zstd.decompress(pathCacheZstd, pathSave, err => err ? reject(err) : resolve(pathSave)));
	};
};