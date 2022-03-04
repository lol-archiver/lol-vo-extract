import AS from 'assert';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import Axios from 'axios';

import Biffer from '@nuogz/biffer';

import { dirCache } from '../../../lib/global.dir.js';
import { C, G, TT } from '../../../lib/global.js';
import { toHexL, unzstd } from '../../../lib/Tool.js';

import Bundle from './Bundle.js';
import Langauge from './Lang.js';
import FileEntry from './FileEntry.js';
import Directory from './Directory.js';
import File from './File.js';


/**
 * @param {Biffer} biffer
 * @param {typeof import('./ManifestListItem.js').default} Item
 * @returns {Array<Item.>}
 */
const parseManifestList = (biffer, Item) => {
	const [count] = biffer.unpack('l');

	const items = [];

	for(let i = 1; i <= count; i++) {
		if(i % 1000 == 0 || i == count || i == 1) {
			G.infoU(TT('parseManifestList:where'), TT('parseManifestList:do', { item: Item.nameItem }), TT('parseManifestList:ing', { progess: `${i}/${count}` }));
		}

		const pos = biffer.tell();
		const [offset] = biffer.unpack('l');

		biffer.seek(pos + offset);

		items.push(Item.parse(biffer, i));

		biffer.seek(pos + 4);
	}

	G.infoD(TT('parseManifestList:where'), TT('parseManifestList:do', { item: Item.nameItem }), TT('parseManifestList:ok', { progess: `${count}/${count}` }));

	return items;
};


export default class Manifest {
	static async fetch(id, url, nameFile) {
		const file = resolve(dirCache, 'manifest', nameFile);

		if(existsSync(file)) {
			G.debugD(TT('fetchManifest:where'), TT('fetchManifest:do', { id }), TT('fetchManifest:cached'));

			return readFileSync(file);
		}

		G.debugU(TT('fetchManifest:where'), TT('fetchManifest:do', { id }), TT('fetchManifest:ing', { url }));

		const { data: bufferManifest } = await Axios.get(url, { responseType: 'arraybuffer', proxy: C.proxy, timeout: 1000 * 60 * 4 });

		writeFileSync(file, bufferManifest);

		G.debugD(TT('fetchManifest:where'), TT('fetchManifest:do', { id }), TT('fetchManifest:ok', { size: bufferManifest.length }));

		return bufferManifest;
	}


	/** @type {string} */
	url;
	/** @type {number} */
	version;
	/** @type {Buffer} */
	buffer;

	constructor(url, version, buffer) {
		this.url = url;
		this.version = version;
		this.buffer = buffer;
	}


	parse(bufferRaw) { return this.parseRMAN(bufferRaw).parseBody(); }

	parseRMAN(bufferRaw) {
		const bifferRaw = new Biffer(bufferRaw);

		const [codeMagic, versionMajor, versionMinor] = bifferRaw.unpack('4sBB');

		AS(codeMagic == 'RMAN', 'invalid magic code');
		AS(versionMajor == 2 && versionMinor == 0, `unsupported RMAN version: ${versionMajor}.${versionMinor}`);


		const [bitsFlag, offset, length, idManifest, sizeBody] = bifferRaw.unpack('HLLQL');

		AS(bitsFlag & (1 << 9));
		AS(offset == bifferRaw.tell());


		this.id = idManifest;
		this.sizeBody = sizeBody;


		this.buffer = unzstd(
			bifferRaw.slice(length),
			resolve(dirCache, 'manifest', `${this.version}-${toHexL(this.id, 0, false)}-body.manifest`)
		);

		return this;
	}

	parseBody() {
		const biffer = new Biffer(this.buffer);

		// header (unknown values, skip it)
		const [n] = biffer.unpack('l');
		biffer.skip(n);

		// offsets to tables(convert to absolute)
		const offsetsBase = biffer.tell();
		const d = biffer.unpack('6l');
		const offsets = d.map((v, i) => offsetsBase + 4 * i + v);

		biffer.seek(offsets[0]);
		/** @type {Array<Bundle>} */
		this.bundles = parseManifestList(biffer, Bundle);

		biffer.seek(offsets[1]);

		this.languages = {};
		parseManifestList(biffer, Langauge).forEach(language => this.languages[language.id] = language.name);

		// Build a map of chunks, indexed by ID
		// Some of ChunkIDs are duplicates, but they are always the same size
		/** @type {Object.<string, typeof Bundle.Chunk>} */
		this.chunks = {};
		for(const bundle of this.bundles) {
			for(const chunk of bundle.chunks) {
				AS(!this.chunks[chunk.id] || (this.chunks[chunk.id].sizeCompressed == chunk.sizeCompressed || this.chunks[chunk.id].sizeUncompressed == chunk.sizeUncompressed));

				this.chunks[chunk.id] = chunk;

				chunk.idBundle = bundle.id;
			}
		}

		biffer.seek(offsets[2]);

		/** @type {FileEntry[]} */
		this.fileEntries = parseManifestList(biffer, FileEntry);

		biffer.seek(offsets[3]);

		const directories = parseManifestList(biffer, Directory);
		const directories_id = {};
		for(const directory of directories) {
			directories_id[directory.id] = directory;
		}

		// merge files and directory data
		const files = {};
		for(const fileEntry of this.fileEntries) {
			const { id, link, idsLanguage, sizeFile, idsChunk } = fileEntry;
			let { name, idDirectory } = fileEntry;

			while(idDirectory) {
				const directory = directories_id[idDirectory] || {};

				const dirName = directory.name;
				idDirectory = directory.idParent;

				name = `${dirName}/${name}`;
			}

			const languages = (idsLanguage || []).map(id => this.languages[id]);
			const fileChunks = (idsChunk || []).map(id => this.chunks[id]);

			files[name] = new File(id, name, sizeFile, link, languages, fileChunks, this.version);
		}

		this.files = files;

		return this;
	}
}