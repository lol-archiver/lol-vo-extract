module.exports = class Chunk {
	constructor(id, offset, size, targetSize) {
		this.id = id;
		this.offset = offset;
		this.size = size;
		this.targetSize = targetSize;
	}
};