import { appendFileSync } from 'fs';
import { parse, resolve } from 'path';

import Bluebird from 'bluebird';
import FSX from 'fs-extra';
import { decompress } from 'node-zstandard';

import { dirCache } from '../../../lib/global.dir.js';
import { G } from '../../../lib/global.js';
import Biffer from '@nuogz/biffer';

import fetchBundle from '../../fetcher/bundle.js';


const pathCacheZstd = resolve(dirCache, 'zstd');


export default class File {
	constructor(id, name, sizeFile, link, langs, fileChunks, version) {
		this.id = id;
		this.name = name;
		this.sizeFile = sizeFile;
		this.link = link;
		this.langs = langs;
		this.fileChunks = fileChunks;
		this.version = version;
	}

	async extract(version, cdn, pathSave) {
		const setIDBundle = new Set();

		this.fileChunks.forEach(chunk => setIDBundle.add(chunk.idBundle));

		const parseInfo = parse(this.name);

		G.info('FileExtracter', `extract file~{${parseInfo.base}}`, `bundle-length~{${setIDBundle.size}}`);

		const bundleBuffer = {};

		const promises = [];
		const counter = { now: 0, max: setIDBundle.size };
		for(const idBundle of setIDBundle) {
			promises.push(fetchBundle(idBundle, version, cdn, counter).then(([bid, buffer]) => bundleBuffer[bid] = buffer));
		}
		await Bluebird.map(promises, r => r, { concurrency: 45 });

		G.infoU('FileExtracter', `extract file~{${parseInfo.base}}`, `bundle-length~{${setIDBundle.size}} all fetched, unZstding...`);

		FSX.ensureDirSync(parse(pathSave).dir);
		FSX.removeSync(pathSave);
		FSX.removeSync(pathCacheZstd);

		for(const chunk of this.fileChunks) {
			const bid = ('0000000000000000' + chunk.idBundle.toString(16)).slice(-16).toUpperCase();

			const parser = new Biffer(bundleBuffer[bid]);

			parser.seek(chunk.offset);

			appendFileSync(pathCacheZstd, parser.slice(chunk.size));
		}

		return new Promise((resolve, reject) => decompress(pathCacheZstd, pathSave, error => {
			if(error) { reject(error); }

			G.infoD('FileExtracter', `extract file~{${parseInfo.base}}`, '✔ ');

			resolve(pathSave);
		}));
	}
}