import Directory from '../../entry/manifest/Directory';
import parseTableEntry from './tableEntry';


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