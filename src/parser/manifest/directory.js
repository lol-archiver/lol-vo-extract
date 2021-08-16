import Directory from '../../entry/manifest/Directory.js';
import parseTableEntry from './tableEntry.js';


export default async function parseDirectory(biffer) {
	const entry = parseTableEntry(biffer, [
		null,
		null,
		['id', '<Q'],
		['idParent', '<Q'],
		['name', 'string'],
	]);

	return new Directory(entry.id, entry.name, entry.idParent);
}