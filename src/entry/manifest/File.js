import { appendFileSync } from 'fs';
import { parse, resolve } from 'path';

import Bluebird from 'bluebird';
import { ensureDirSync, removeSync } from '../../../lib/fs-extra.js';
import { decompress } from 'node-zstandard';

import Biffer from '@nuogz/biffer';

import { G } from '@nuogz/pangu';

import { dirCache } from '../../../lib/dir.js';
import { T } from '../../../lib/i18n.js';

import Bundle from './Bundle.js';



const pathCacheZstd = resolve(dirCache, 'zstd');


export default class File {
	/** @type {bigint} */
	id;
	/** @type {string} */
	name;
	/** @type {string} */
	sizeFile;
	/** @type {string} */
	link;
	/** @type {} */
	languages;
	/** @type {} */
	fileChunks;
	/** @type {} */
	version;

	constructor(id, name, sizeFile, link, languages, fileChunks, version) {
		this.id = id;
		this.name = name;
		this.sizeFile = sizeFile;
		this.link = link;
		this.languages = languages;
		this.fileChunks = fileChunks;
		this.version = version;
	}

	async extract(version, cdn, pathSave) {
		const setIDBundle = new Set();

		this.fileChunks.forEach(chunk => setIDBundle.add(chunk.idBundle));

		const parseInfo = parse(this.name);

		G.info(T('extractFile:where'), T('extractFile:do', { file: parseInfo.base }), T('extractFile:info', { size: setIDBundle.size }));

		const bundleBuffer = {};

		const promises = [];
		const counter = { now: 0, max: setIDBundle.size };
		for(const idBundle of setIDBundle) {
			promises.push(Bundle.fetch(idBundle, version, cdn, counter).then(([bid, buffer]) => bundleBuffer[bid] = buffer));
		}
		await Bluebird.map(promises, r => r, { concurrency: 45 });

		G.infoU(T('extractFile:where'), T('extractFile:do', { file: parseInfo.base }), T('extractFile:info', { size: setIDBundle.size }));

		ensureDirSync(parse(pathSave).dir);
		removeSync(pathSave);
		removeSync(pathCacheZstd);

		for(const chunk of this.fileChunks) {
			const bid = ('0000000000000000' + chunk.idBundle.toString(16)).slice(-16).toUpperCase();

			const parser = new Biffer(bundleBuffer[bid]);

			parser.seek(chunk.offset);

			appendFileSync(pathCacheZstd, parser.slice(chunk.sizeCompressed));
		}

		return new Promise((resolve, reject) => decompress(pathCacheZstd, pathSave, error => {
			if(error) { reject(error); }

			G.infoD(T('extractFile:where'), T('extractFile:do', { file: parseInfo.base }), '✔ ');

			resolve(pathSave);
		}));
	}
}
