import { TT } from '../../../lib/global.js';

import ManifestListItem from './ManifestListItem.js';
import ManifestListEntry from './ManifestListEntry.js';


export default class FileEntry extends ManifestListItem {
	static nameItem = TT('manifest:item.fileEntry');

	static parse(biffer) {
		const entry = new ManifestListEntry([
			null,
			['chunks', 'offset'],
			['id', 'Q'],
			['idDirectory', 'Q'],
			['sizeFile', 'L'],
			['name', 'string'],
			['locales', 'Q'],
			null,
			null,
			null,
			null,
			['link', 'string'],
			null,
			null,
			null,
		]).parse(biffer);


		const idLanguages = [];
		if(entry.locales) {
			for(let i = 0; i < 64; i++) {
				if(entry.locales & (BigInt(1) << BigInt(i))) {
					idLanguages.push(i + 1);
				}
			}
		}

		biffer.seek(entry.chunks);

		const sizeChunk = biffer.unpack('L');
		const idsChunk = biffer.unpack(`${sizeChunk}Q`);

		return new FileEntry(entry.id, entry.name, entry.link, idLanguages, entry.idDirectory, entry.sizeFile, idsChunk);
	}

	/** @type {bigint} */
	id;
	/** @type {string} */
	name;
	/** @type {string} */
	link;
	/** @type {number[]} */
	idsLanguage;
	/** @type {bigint} */
	idDirectory;
	/** @type {number} */
	sizeFile;
	/** @type {bigint[]} */
	idsChunk;


	constructor(id, name, link, idsLanguage = [], idDirectory, sizeFile, idsChunk = []) {
		super();

		this.id = id;
		this.name = name;
		this.link = link;
		this.idsLanguage = idsLanguage;
		this.idDirectory = idDirectory;
		this.sizeFile = sizeFile;
		this.idsChunk = idsChunk;
	}
}