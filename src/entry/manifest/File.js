let fetchBundle = require('../../fetcher/bundle');

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

	this.extract = async function(version, cdn) {
		let bundleIDSet = new Set();

		this.fileChunks.forEach(chunk => bundleIDSet.add(chunk.bundleID));

		L(`[File] ${this.name} length ${bundleIDSet.size}`);

		let bundleBuffer = {};
		for(let bundleID of bundleIDSet) {
			let [bid, buffer] = await fetchBundle(bundleID, version, cdn);

			bundleBuffer[bid] = buffer;
		}

		let pathFinal = _pa.join('./_cache/assets/', this.name);

		Fex.removeSync(pathFinal);

		for(let chunk of this.fileChunks) {
			let bid = ('0000000000000000' + chunk.bundleID.toString(16)).slice(-16).toUpperCase();

			let parser = Biffer(bundleBuffer[bid]);

			parser.seek(chunk.offset);

			Fex.ensureDirSync(_pa.parse(pathFinal).dir);

			let chunkBuffer = await T.unZstd(_pa.join('./_cache/chunk', `${chunk.chunkID}.chunk`), parser.raw(chunk.size), true);

			Fex.appendFileSync(pathFinal, chunkBuffer);
		}

		return pathFinal;
	};
};