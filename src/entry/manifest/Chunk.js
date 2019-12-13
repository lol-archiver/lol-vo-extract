module.exports = function Chunk(chunkID, bundle, offset, size, targetSize) {
	if(!(this instanceof Chunk)) {
		return new Chunk(...arguments);
	}

	this.chunkID = chunkID;
	this.bundle = bundle;
	this.offset = offset;
	this.size = size;
	this.targetSize = targetSize;
};