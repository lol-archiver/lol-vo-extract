import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import Axios from 'axios';
import joinURL from 'url-join';

import { C, G, TT } from '../../../lib/global.js';

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
	static async fetch(id, version, cdn, counter) {
		const bid = ('0000000000000000' + id.toString(16)).slice(-16).toUpperCase();

		const pathBundle = join('./_cache/bundle', `${bid}.bundle`);

		let bufferBundle;
		if(existsSync(pathBundle)) {
			++counter.now;
			// G.infoU(TT('fetchBundle:where'), TT('fetchBundle:doing', { bid, progess: `${++counter.now}/${counter.max}` }), TT('fetchBundle:cached'));

			bufferBundle = readFileSync(pathBundle);
		}
		else {
			G.infoU(TT('fetchBundle:where'), TT('fetchBundle:doing', { bid, progess: `${counter.now + 1}/${counter.max}` }), TT('fetchBundle:ing'));

			const bundleURL = joinURL(cdn, `channels/public/bundles/${bid}.bundle`);

			let timesFetched = 0;
			let passFetched = false;

			while(timesFetched++ <= 4) {
				try {
					const { data, headers } = await Axios.get(bundleURL, { responseType: 'arraybuffer', proxy: C.server.proxy, timeout: 1000 * 60 * 4 });

					if(data.length != headers['content-length']) {
						G.errorU(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), TT('fetchBundle:retry.contentLengthNotMatch', { remains: timesFetched }));
					}
					else {
						const hash = createHash('md5');
						hash.update(data);

						if(headers.etag.toLowerCase() != `"${hash.digest('hex')}"`.toLowerCase()) {
							G.errorU(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), TT('fetchBundle:retry.etagNotMatch', { remains: timesFetched }));
						}
						else {
							passFetched = true;
						}
					}

					if(passFetched) {
						bufferBundle = data;

						G.infoU(TT('fetchBundle:where'), TT('fetchBundle:doing', { bid, progess: `${++counter.now}/${counter.max}` }), TT('fetchBundle:ok'));
						writeFileSync(pathBundle, bufferBundle);

						break;
					}
				}
				catch(error) {
					G.errorU(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), error, TT('fetchBundle:retry.error', { remains: timesFetched }));
				}
			}

			if(!passFetched) {
				throw G.error(TT('fetchBundle:where'), TT('fetchBundle:do', { bid }), `failed finally. over max times`);
			}
		}

		return [bid, bufferBundle];
	}


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