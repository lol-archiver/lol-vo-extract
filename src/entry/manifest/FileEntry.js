
module.exports = function FileEntry(flags, name, link, langIDs, directoryID, fileSize, chunkIDs) {
	if(!(this instanceof FileEntry)) {
		return new FileEntry(...arguments);
	}

	this.flags = flags;
	this.name = name;
	this.link = link;
	this.langIDs = langIDs;
	this.directoryID = directoryID;
	this.fileSize = fileSize;
	this.chunkIDs = chunkIDs;
};