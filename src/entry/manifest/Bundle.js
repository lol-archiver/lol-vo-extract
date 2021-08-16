import Chunk from './Chunk.js';


export default class Bundle {
	constructor(id) {
		this.id = id;
		this.chunks = [];
	}

	addChunk(id, size, targetSize) {
		const lastChunk = this.chunks[this.chunks.length - 1];

		this.chunks.push(
			new Chunk(id, (lastChunk ? lastChunk.offset + lastChunk.size : 0), size, targetSize)
		);
	}
}