import { resolve, removeSync, appendFileSync } from 'fs';
import { parse } from 'path';

import { map } from 'bluebird';
import { decompress } from 'node-zstandard';
import { ensureDirSync } from 'fs-extra';

import { G, dirCache } from '../../../lib/global';
import Biffer from '../../../lib/Biffer';

import fetchBundle from '../../fetcher/bundle';


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

		G.info('FileExtracter', `[${this.name}] length [${setIDBundle.size}]`);

		const bundleBuffer = {};

		const promises = [];
		const counter = { now: 0, max: setIDBundle.size };
		for(const idBundle of setIDBundle) {
			promises.push(fetchBundle(idBundle, version, cdn, counter).then(([bid, buffer]) => bundleBuffer[bid] = buffer));
		}
		await map(promises, r => r, { concurrency: 45 });

		G.info('FileExtracter', `[${this.name}] AllFetched, UnZstding...`);

		ensureDirSync(parse(pathSave).dir);
		removeSync(pathSave);
		removeSync(pathCacheZstd);

		for(const chunk of this.fileChunks) {
			const bid = ('0000000000000000' + chunk.idBundle.toString(16)).slice(-16).toUpperCase();

			const parser = new Biffer(bundleBuffer[bid]);

			parser.seek(chunk.offset);

			appendFileSync(pathCacheZstd, parser.raw(chunk.size));
		}

		return new Promise((resolve, reject) => decompress(pathCacheZstd, pathSave, err => err ? reject(err) : resolve(pathSave)));
	}
}