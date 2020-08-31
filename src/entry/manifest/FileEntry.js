module.exports = class FileEntry {
	constructor(id, name, link, langIDs, idDirectory, sizeFile, idsChunk) {
		this.id = id;
		this.name = name;
		this.link = link;
		this.langIDs = langIDs;
		this.idDirectory = idDirectory;
		this.sizeFile = sizeFile;
		this.idsChunk = idsChunk;
	}
};