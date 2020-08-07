module.exports = class HircSound {
	constructor(id, embedType, audioID, sourceID) {
		this.id = id;

		this.embedType = embedType;
		this.audioID = audioID;
		this.sourceID = sourceID;

		this.fileIndex = null;
		this.fileLength = null;

		this.soundType = null;
	}
};