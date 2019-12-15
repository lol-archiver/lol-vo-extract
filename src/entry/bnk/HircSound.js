module.exports = function HircSound(id, embedType, audioID, sourceID) {
	if(!(this instanceof HircSound)) {
		return new HircSound(...arguments);
	}

	this.id = id;

	this.embedType = embedType;
	this.audioID = audioID;
	this.sourceID = sourceID;

	this.fileIndex = null;
	this.fileLength = null;

	this.soundType = null;
};