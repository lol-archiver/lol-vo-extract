import { writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import FSX from 'fs-extra';

import { G, I } from '../../lib/global.js';
import Biffer from '../../lib/Biffer.js';
import { toHexL } from '../../lib/Tool.js';

import HircSound from '../entry/bnk/HircSound.js';
import HircEvent from '../entry/bnk/HircEvent.js';
import HircPool from '../entry/bnk/HircPool.js';
import HircSwitchContainer from '../entry/bnk/HircSwitchContainer.js';

import parseHircEntry from '../parser/bnk/hircEntry.js';


let mapEventID = {};
try {
	mapEventID = FSX.readJsonSync(`../../data/EventIDMap/${I.slot}.json`);
}
catch(error) { void 0; }

const fnv_1 = function(name) {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};

const parseActionSoundEntry = function(entryParsed, arrEntryAll, hircID) {
	const result = [];

	if(entryParsed instanceof HircSound) {
		result.push(entryParsed.audioID);
	}
	else if(entryParsed instanceof HircPool) {
		const arrEntry = arrEntryAll.filter(entry => entryParsed.soundIDs.includes(entry.id));

		for(const entry of arrEntry) {
			for(const eventAudio of parseActionSoundEntry(entry, arrEntryAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(entryParsed instanceof HircSwitchContainer) {
		const arrEntry = arrEntryAll.filter(entry => entryParsed.arrContainerID.includes(entry.id));

		for(const entry of arrEntry) {
			for(const eventAudio of parseActionSoundEntry(entry, arrEntryAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(!entryParsed) {
		G.warn('BNKParser', 'unknown ~[action sound entry]', hircID);
	}
	else {
		G.warn('BNKParser', 'unknown ~[action sound entry]', entryParsed);
	}

	return result;
};

const getEventFull = function(mapHash_EventName, hircEventID) {
	let eventFull = mapHash_EventName[hircEventID];

	while(!eventFull && mapEventID[hircEventID]) {
		eventFull = mapHash_EventName[hircEventID = mapEventID[hircEventID]];
	}

	return eventFull;
};

export default async function parseBnk(bnkPath, eventNameSet) {
	G.infoU('BNKParser', `parse BNK~{${parse(bnkPath).base}}`, 'parsing...');

	const bnkBiffer = new Biffer(bnkPath);

	const arrEntry = [];

	while(!bnkBiffer.isEnd()) {
		const [magic, sectionSize] = bnkBiffer.unpack('4sL');

		if(magic == 'HIRC') {
			const sectionBiffer = bnkBiffer.sub(sectionSize);

			const [count] = sectionBiffer.unpack('L');

			for(let i = 0; i < count; i++) {
				const [type, length, id] = sectionBiffer.unpack('BLL');

				const entry = parseHircEntry(type, id, sectionBiffer.sub(length - 4));

				if(entry) {
					arrEntry.push(entry);
				}
			}
		}
		else {
			bnkBiffer.skip(sectionSize);

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

	const hircEventArr = arrEntry.filter(entry => entry instanceof HircEvent);

	for(const hircEvent of hircEventArr) {
		const arrEventAudio = [];

		let eventFull = getEventFull(mapHash_EventName, hircEvent.id);

		if(!eventFull) {
			G.warn('BNKParser', 'unknown ~[Hirc Event ID]', `~{${hircEvent.id}}`);

			eventFull = hircEvent.id;
		}

		if(hircEvent.count) {
			for(const actionID of hircEvent.eventActions) {
				const action = arrEntry.find(entry => entry.id == actionID);

				const actionSoundEntry = arrEntry.find(entry => entry.id == action.hircID);

				for(const eventAudio of parseActionSoundEntry(actionSoundEntry, arrEntry, action.hircID)) {
					arrEventAudio.push(eventAudio);
				}
			}
		}

		for(const audioID of arrEventAudio) {
			(mapAudioID_EventName[audioID] || (mapAudioID_EventName[audioID] = new Set())).add(eventFull);
		}
	}

	const hircsPool = JSON.parse(JSON.stringify(arrEntry.filter(entry => entry instanceof HircPool)))
		.map(p => p.soundIDs = p.soundIDs.map(id => {
			const entry = arrEntry.find(e => e.id == id);

			if(entry instanceof HircSound) {
				const audioID = entry.audioID || 0;
				return `${audioID}|${toHexL(audioID, 8)}`;
			}
			else if(entry instanceof HircPool) {
				return entry.soundIDs.map(sid => {
					const entrySub = arrEntry.find(e => e.id == sid);

					const audioID = entrySub.audioID || 0;
					return `${audioID}|${toHexL(audioID, 8)}`;
				});
			}
		}));

	writeFileSync(
		resolve('_text', '_pool', parse(bnkPath).base + '.json'),
		JSON.stringify(hircsPool, null, '\t')
	);

	G.infoD('BNKParser', `parse BNK~{${parse(bnkPath).base}}`, '✔ ');

	return mapAudioID_EventName;
}
