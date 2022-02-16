import AS from 'assert';
import { resolve } from 'path';

import Biffer from '@nuogz/biffer';

import { dirCache } from '../../../lib/global.dir.js';
import { toHexL, unzstd } from '../../../lib/Tool.js';

import File from './File.js';
import TableParser from '../../parser/manifest/table.js';
import BundleParser from '../../parser/manifest/bundle.js';
import LangParser from '../../parser/manifest/lang.js';
import FileEntryParser from '../../parser/manifest/fileEntry.js';
import DirectoryParser from '../../parser/manifest/directory.js';


export default class Manifest {
	constructor(url, version, buffer) {
		this.url = url;
		this.version = version;
		this.buffer = buffer;
	}

	parse(bufferRaw) { return this.parseRMAN(bufferRaw).parseBody(); }

	parseRMAN(bufferRaw) {
		const bifferManifest = new Biffer(bufferRaw);

		const [codeMagic, versionMajor, versionMinor] = bifferManifest.unpack('<4sBB');

		AS(codeMagic == 'RMAN', 'invalid magic code');
		AS(versionMajor == 2 && versionMinor == 0, `unsupported RMAN version: ${versionMajor}.${versionMinor}`);


		const [bitsFlag, offset, length, idManifest, sizeBody] = bifferManifest.unpack('<HLLQL');

		AS(bitsFlag & (1 << 9));
		AS(offset == bifferManifest.tell());


		this.id = idManifest;
		this.sizeBody = sizeBody;


		this.buffer = unzstd(
			bifferManifest.slice(length),
			resolve(dirCache, 'manifest', `${this.version}-${toHexL(this.id, 0, false)}-body.manifest`)
		);

		return this;
	}

	async parseBody() {
		const biffer = new Biffer(this.buffer);

		// header (unknown values, skip it)
		const [n] = biffer.unpack('<l');
		biffer.skip(n);

		// offsets to tables(convert to absolute)
		const offsetsBase = biffer.tell();
		const d = biffer.unpack('<6l');
		const offsets = d.map((v, i) => offsetsBase + 4 * i + v);

		biffer.seek(offsets[0]);
		this.bundles = await TableParser(biffer, BundleParser);

		biffer.seek(offsets[1]);

		this.langs = {};
		(await TableParser(biffer, LangParser)).forEach(lang => this.langs[lang.langID] = lang.lang);

		// Build a map of chunks, indexed by ID
		// Some of ChunkIDs are duplicates, but they are always the same size
		this.chunks = {};
		for(const bundle of this.bundles) {
			for(const chunk of bundle.chunks) {
				AS(!this.chunks[chunk.id] || (this.chunks[chunk.id].size == chunk.size || this.chunks[chunk.id].targetSize == chunk.targetSize));

				this.chunks[chunk.id] = chunk;

				chunk.idBundle = bundle.id;
			}
		}

		biffer.seek(offsets[2]);

		this.fileEntries = await TableParser(biffer, FileEntryParser);

		biffer.seek(offsets[3]);

		const directories = await TableParser(biffer, DirectoryParser);
		const directories_id = {};
		for(const directory of directories) {
			directories_id[directory.id] = directory;
		}

		// merge files and directory data
		const files = {};
		for(const fileEntry of this.fileEntries) {
			const { id, link, langIDs, sizeFile, idsChunk } = fileEntry;
			let { name, idDirectory } = fileEntry;

			while(idDirectory) {
				const directory = directories_id[idDirectory] || {};

				const dirName = directory.name;
				idDirectory = directory.parentID;

				name = `${dirName}/${name}`;
			}

			const langs = (langIDs || []).map(id => this.langs[id]);
			const fileChunks = (idsChunk || []).map(id => this.chunks[id]);

			files[name] = new File(id, name, sizeFile, link, langs, fileChunks, this.version);
		}

		this.files = files;

		return this;
	}
}