import FileEntry from '../../entry/manifest/FileEntry';
import parseTableEntry from './tableEntry';


export default async function parserFileEntry(biffer) {
	const entry = parseTableEntry(biffer, [
		null,
		['chunks', 'offset'],
		['id', '<Q'],
		['idDirectory', '<Q'],
		['sizeFile', '<L'],
		['name', 'string'],
		['locales', '<Q'],
		null,
		null,
		null,
		null,
		['link', 'string'],
		null,
		null,
		null,
	]);

	const langIDs = [];
	if(entry.locales) {
		for(let i = 0; i < 64; i++) {
			if(entry.locales & (BigInt(1) << BigInt(i))) {
				langIDs.push(i + 1);
			}
		}
	}

	biffer.seek(entry.chunks);

	const sizeChunk = biffer.unpack('<L');
	const idsChunk = biffer.unpack(`<${sizeChunk}Q`);

	return new FileEntry(entry.id, entry.name, entry.link, langIDs, entry.idDirectory, entry.sizeFile, idsChunk);
};