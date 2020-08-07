
module.exports = class FileEntry {
	constructor(flags, name, link, langIDs, idDirectory, fileSize, idsChunk) {
		this.flags = flags;
		this.name = name;
		this.link = link;
		this.langIDs = langIDs;
		this.idDirectory = idDirectory;
		this.fileSize = fileSize;
		this.idsChunk = idsChunk;
	}
};