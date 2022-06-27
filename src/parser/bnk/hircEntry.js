import { G } from '../../../lib/global.js';
import Biffer from '@nuogz/biffer';

import HIRCSound from '../../entry/bnk/HIRCSound.js';
import HIRCAction from '../../entry/bnk/HIRCAction.js';
import HIRCEvent from '../../entry/bnk/HIRCEvent.js';
import HIRCPool from '../../entry/bnk/HIRCPool.js';
import HIRCSwitchContainer from '../../entry/bnk/HIRCSwitchContainer.js';


export default function parseHIRCEntry(type, id, B) {
	let entry;

	// Sound
	if(type == 2) {
		const [embedType, audioID, sourceID] = B.unpack('xxxxBLL');

		entry = new HIRCSound(id, embedType, audioID, sourceID);

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
		const [scope, actionType, HIRCID, paramCount] = B.unpack('BBLxB');

		entry = new HIRCAction(id, scope, actionType, HIRCID, paramCount);

		entry.scope = scope;
		entry.actionType = actionType;
		entry.HIRCID = HIRCID;

		// if(paramCount) {
		// 	// Unused Struct
		// 	entry.paramTypes = B.unpack(`${paramCount}B`);
		// 	// entry.params = B.unpack(`${paramCount}L`);

		// 	L('Even Action Param Types: ', id, HIRCID, entry.paramTypes.join(','));
		// }
	}
	// Event
	else if(type == 4) {
		const [count] = B.unpack('B');

		entry = new HIRCEvent(id, count);

		entry.count = count;

		if(count) {
			entry.eventActions = B.unpack(`${count}L`);
		}
	}
	// Pool
	else if(type == 5) {
		entry = new HIRCPool(id);

		const b = new Biffer(Buffer.from([...B.target].reverse()));

		while(b.unpack('>L')[0] == 0xC350) {
			entry.soundIDs.push(b.unpack('>L')[0]);
		}

		entry.soundIDs.reverse();
	}
	// Switch Container
	else if(type == 6) {
		G.debug('HIRCEntryParser', 'Need More Switch Container Confirm');

		entry = new HIRCSwitchContainer(id);

		const b = new Biffer(Buffer.from([...B.target].reverse()));

		while(b.unpack('LLBB').join('|') == '0|0|1|0') {
			entry.arrContainerID.push(b.unpack('>L')[0]);
		}

		entry.arrContainerID.reverse();
	}
	// else {
	// 	// unused Type
	// 	// 7: Actor Mixer
	// 	// 14: Attenuation
	// 	L(type, id);
	// }


	return entry;
}
