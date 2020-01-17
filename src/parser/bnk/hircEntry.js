const HircSound = require('../../entry/bnk/HircSound');
const HircAction = require('../../entry/bnk/HircAction');
const HircEvent = require('../../entry/bnk/HircEvent');
const HircPool = require('../../entry/bnk/HircPool');
const HircSwitchContainer = require('../../entry/bnk/HircSwitchContainer');

module.exports = function parseEntry(type, id, B) {
	let entry;

	// Sound
	if(type == 2) {
		const [embedType, audioID, sourceID] = B.unpack('xxxxBLL');

		entry = HircSound(id, embedType, audioID, sourceID);

		if(embedType == 0) {
			const [fileIndex, fileLength] = B.unpack('LL');

			entry.fileIndex = fileIndex;
			entry.fileLength = fileLength;
		}

		const [soundType] = B.unpack('L');

		entry.soundType = soundType;
		// Unused Sound structure;
	}
	// Event Action
	else if(type == 3) {
		const [scope, actionType, hircID, paramCount] = B.unpack('BBLxB');

		entry = HircAction(id, scope, actionType, hircID, paramCount);

		entry.scope = scope;
		entry.actionType = actionType;
		entry.hircID = hircID;

		// if(paramCount) {
		// 	// Unused Struct
		// 	entry.paramTypes = B.unpack(`${paramCount}B`);
		// 	// entry.params = B.unpack(`${paramCount}L`);

		// 	L('Even Action Param Types: ', id, hircID, entry.paramTypes.join(','));
		// }
	}
	// Event
	else if(type == 4) {
		const [count] = B.unpack('B');

		entry = HircEvent(id, count);

		entry.count = count;

		if(count) {
			entry.eventActions = B.unpack(`${count}L`);
		}
	}
	// Pool
	else if(type == 5) {
		entry = HircPool(id);

		const b = Biffer(Buffer.from([...B.buffer].reverse()));

		while(b.unpack('>L')[0] == 0xC350) {
			entry.soundIDs.push(b.unpack('>L')[0]);
		}
	}
	// Switch Container
	else if(type == 6) {
		L('[DEBUG] Need More Switch Container Confirm');

		entry = HircSwitchContainer(id);

		const b = Biffer(Buffer.from([...B.buffer].reverse()));

		while(b.unpack('LLBB').join('|') == '0|0|1|0') {
			entry.arrContainerID.push(b.unpack('>L')[0]);
		}
	}
	// else {
	// 	// unused Type
	// 	// 7: Actor Mixer
	// 	// 14: Attenuation
	// 	L(type, id);
	// }


	return entry;
};