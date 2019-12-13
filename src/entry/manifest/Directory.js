module.exports = function Directory(name, directoryID, parentID) {
	if(!(this instanceof Directory)) {
		return new Directory(...arguments);
	}

	this.name = name;
	this.directoryID = directoryID;
	this.parentID = parentID;
};