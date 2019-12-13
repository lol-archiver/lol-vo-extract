module.exports = function HIRC(type, id) {
	if(!(this instanceof HIRC)) {
		return new HIRC(...arguments);
	}

	this.type = type;
	this.id = id;

	this.parse = function(B) {
		// Sound
		if(type == 2) {
			const [embedType, audioID, sourceID] = B.unpack('xxxxBLL');

			this.embedType = embedType;
			this.audioID = audioID;
			this.sourceID = sourceID;

			if(embedType == 0) {
				const [fileIndex, fileLength] = B.unpack('LL');

				this.fileIndex = fileIndex;
				this.fileLength = fileLength;
			}

			const [soundType] = B.unpack('L');

			this.soundType = soundType;

			// Unused Sound structure;
		}
		// Even Action
		else if(type == 3) {
			const [scope, actionType, hircID, paramCount] = B.unpack('BBLxB');

			this.scope = scope;
			this.actionType = actionType;
			this.hircID = hircID;

			if(paramCount) {
				// Unused Struct
				this.paramTypes = B.unpack(`${paramCount}B`);
				this.params = B.unpack(`${paramCount}L`);

				L('Unused Even Action Param', actionType, paramCount);
			}

			// Unused Struct
			if(this.actionType != 4) {
				debugger;
			}
		}
		// Event
		else if(type == 4) {
			const [count] = B.unpack('B');

			this.count = count;

			if(count) {
				this.eActions = B.unpack(`${count}L`);
			}
		}
		// Pool
		else if(type == 5) {
			const b = Biffer(Buffer.from([...B.buffer].reverse()));

			this.soundIDs = [];

			while(b.unpack('>L')[0] == 0xC350) {
				this.soundIDs.push(b.unpack('>L')[0]);
			}
		}

		return this;
	};
};