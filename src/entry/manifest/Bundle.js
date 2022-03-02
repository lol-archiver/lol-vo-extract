import { TT } from '../../../lib/global.js';

import ManifestListItem from './ManifestListItem.js';


class Chunk {
	/** @type {number} */
	id;
	/** @type {number} */
	offset;
	/** @type {number} */
	sizeCompressed;
	/** @type {number} */
	sizeUncompressed;

	constructor(id, offset, sizeCompressed, sizeUncompressed) {
		this.id = id;
		this.offset = offset;
		this.sizeCompressed = sizeCompressed;
		this.sizeUncompressed = sizeUncompressed;
	}
}

export default class Bundle extends ManifestListItem {
	static Chunk = Chunk;

	static nameItem = TT('manifest:item.bundle');

	static parse(biffer) {
		const [, sizeHeader, id] = biffer.unpack('llQ');

		// Skip remaining header part
		biffer.skip(sizeHeader - 12);

		const bundle = new Bundle(id);
		const chunks = bundle.chunks;

		const [sizeChunk] = biffer.unpack('l');
		for(let i = 0; i < sizeChunk; i++) {
			const pos = biffer.tell();
			const [offset] = biffer.unpack('l');

			biffer.seek(pos + offset);
			biffer.skip(4); // skip offset table offset

			const [sizeCompressed, sizeUncompressed, idChunk] = biffer.unpack('LLQ');

			const chunkLast = chunks[chunks.length - 1];

			chunks.push(
				new Chunk(
					idChunk,
					chunkLast ? chunkLast.offset + chunkLast.sizeCompressed : 0,
					sizeCompressed,
					sizeUncompressed,
				)
			);

			biffer.seek(pos + 4);
		}

		return bundle;
	}


	/** @type {number} */
	id;
	/** @type {Chunk[]} */
	chunks = [];

	constructor(id) {
		super();

		this.id = id;
	}
}