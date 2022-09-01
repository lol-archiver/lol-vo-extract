import { writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { readJSONSync } from '../../lib/fs-extra.js';

import { G } from '@nuogz/pangu';
import Biffer from '@nuogz/biffer';

import { I } from '../../lib/info.js';
import { toHexL } from '../../lib/utility.js';

import HIRCSound from '../entry/bnk/HIRCSound.js';
import HIRCEvent from '../entry/bnk/HIRCEvent.js';
import HIRCPool from '../entry/bnk/HIRCPool.js';
import HIRCSwitchContainer from '../entry/bnk/HIRCSwitchContainer.js';

import parseHIRCEntry from '../parser/bnk/HIRCEntry.js';



let mapEventID = {};
try {
	mapEventID = readJSONSync(`../../data/EventIDMap/${I.slot}.json`);
}
catch(error) { void 0; }

const fnv_1 = name => {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};

const parseActionSoundEntry = (entryParsed, arrEntryAll, HIRCID) => {
	const result = [];

	if(entryParsed instanceof HIRCSound) {
		result.push(entryParsed.audioID);
	}
	else if(entryParsed instanceof HIRCPool) {
		const arrEntry = arrEntryAll.filter(entry => entryParsed.soundIDs.includes(entry.id));

		for(const entry of arrEntry) {
			for(const eventAudio of parseActionSoundEntry(entry, arrEntryAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(entryParsed instanceof HIRCSwitchContainer) {
		const arrEntry = arrEntryAll.filter(entry => entryParsed.arrContainerID.includes(entry.id));

		for(const entry of arrEntry) {
			for(const eventAudio of parseActionSoundEntry(entry, arrEntryAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(!entryParsed) {
		G.warn('BNKParser', 'unknown ~[action sound entry]', HIRCID);
	}
	else {
		G.warn('BNKParser', 'unknown ~[action sound entry]', entryParsed);
	}

	return result;
};

const getEventFull = (mapHash_EventName, HIRCEventID) => {
	let eventFull = mapHash_EventName[HIRCEventID];

	while(!eventFull && mapEventID[HIRCEventID]) {
		eventFull = mapHash_EventName[HIRCEventID = mapEventID[HIRCEventID]];
	}

	return eventFull;
};

export default async function parseBNK(bnkPath, eventNameSet) {
	G.infoU('BNKParser', `parse BNK~{${parse(bnkPath).base}}`, 'parsing...');

	const bifferBNK = new Biffer(bnkPath);

	const arrEntry = [];

	while(!bifferBNK.isEnd()) {
		const [magic, sectionSize] = bifferBNK.unpack('4sL');

		if(magic == 'HIRC') {
			const sectionBiffer = bifferBNK.sub(sectionSize);

			const [count] = sectionBiffer.unpack('L');

			for(let i = 0; i < count; i++) {
				const [type, length, id] = sectionBiffer.unpack('BLL');

				const entry = parseHIRCEntry(type, id, sectionBiffer.sub(length - 4));

				if(entry) {
					arrEntry.push(entry);
				}
			}
		}
		else {
			bifferBNK.skip(sectionSize);

			if(magic != 'BKHD') {
				G.warn('BNKParser', 'unknown ~[BNK magic]', `~{${magic}}`);
			}
		}
	}

	const mapHash_EventName = {};
	const mapAudioID_EventName = {};

	for(const event of eventNameSet) {
		mapHash_EventName[fnv_1(event)] = event;
	}

	const HIRCEventArr = arrEntry.filter(entry => entry instanceof HIRCEvent);

	for(const HIRCEvent of HIRCEventArr) {
		const arrEventAudio = [];

		let eventFull = getEventFull(mapHash_EventName, HIRCEvent.id);

		if(!eventFull) {
			G.warn('BNKParser', 'unknown ~[HIRC Event ID]', `~{${HIRCEvent.id}}`);

			eventFull = HIRCEvent.id;
		}

		if(HIRCEvent.count) {
			for(const actionID of HIRCEvent.eventActions) {
				const action = arrEntry.find(entry => entry.id == actionID);

				const actionSoundEntry = arrEntry.find(entry => entry.id == action.HIRCID);

				for(const eventAudio of parseActionSoundEntry(actionSoundEntry, arrEntry, action.HIRCID)) {
					arrEventAudio.push(eventAudio);
				}
			}
		}

		for(const audioID of arrEventAudio) {
			(mapAudioID_EventName[audioID] || (mapAudioID_EventName[audioID] = new Set())).add(eventFull);
		}
	}

	const HIRCsPool = JSON.parse(JSON.stringify(arrEntry.filter(entry => entry instanceof HIRCPool)))
		.map(p => p.soundIDs = p.soundIDs.map(id => {
			const entry = arrEntry.find(e => e.id == id);

			if(entry instanceof HIRCSound) {
				const audioID = entry.audioID || 0;
				return `SoundID:${id}|${toHexL(id, 8)} AudioID:${audioID}|${toHexL(audioID, 8)}`;
			}
			else if(entry instanceof HIRCPool) {
				return entry.soundIDs.map(sid => {
					const entrySub = arrEntry.find(e => e.id == sid);

					const audioID = entrySub.audioID || 0;
					return `EntryID:${id}|${toHexL(id, 8)} SoundID:${sid}|${toHexL(sid, 8)} AudioID:${audioID}|${toHexL(audioID, 8)}`;
				});
			}
		}));

	writeFileSync(
		resolve('@pool', `${I.slot}@${I.idsSkin.join(',')}@${parse(bnkPath).base}.json`),
		JSON.stringify(HIRCsPool, null, '\t')
	);

	G.infoD('BNKParser', `parse BNK~{${parse(bnkPath).base}}`, '✔ ');

	return mapAudioID_EventName;
}
