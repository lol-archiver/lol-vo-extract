import Directory from '../../entry/manifest/Directory.js';
import TableEntryParser from './tableEntry.js';


export default function DirectoryParser(biffer) {
	const entry = TableEntryParser(biffer, [
		null,
		null,
		['id', '<Q'],
		['idParent', '<Q'],
		['name', 'string'],
	]);

	return new Directory(entry.id, entry.name, entry.idParent);
}