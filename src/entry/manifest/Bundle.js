const Chunk = require('./Chunk');

module.exports = function Bundle(bundleID) {
	if(!(this instanceof Bundle)) {
		return new Bundle(...arguments);
	}

	this.bundleID = bundleID;
	this.chunks = [];

	this.addChunk = function(chunkID, size, targetSize) {
		let lastChunk = this.chunks[this.chunks.length - 1];
		let offset;

		if(lastChunk) {
			offset = lastChunk.offset + lastChunk.size;
		}
		else {
			offset = 0;
		}

		this.chunks.push(Chunk(chunkID, this, offset, size, targetSize));
	};
};