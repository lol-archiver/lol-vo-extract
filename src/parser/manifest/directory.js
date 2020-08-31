const Directory = require('../../entry/manifest/Directory');
const parseTableEntry = require('./tableEntry');

module.exports = async function parseDirectory(biffer) {
	const entry = parseTableEntry(biffer, [
		null,
		null,
		['id', '<Q'],
		['idParent', '<Q'],
		['name', 'string'],
	]);

	return new Directory(entry.id, entry.name, entry.idParent);
};