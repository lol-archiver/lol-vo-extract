const HircSound = require('../entry/bnk/HircSound');
const HircEvent = require('../entry/bnk/HircEvent');
const HircPool = require('../entry/bnk/HircPool');
const HircSwitchContainer = require('../entry/bnk/HircSwitchContainer');

const parseHircEntry = require('../parser/bnk/hircEntry');

let mapEventID;

try {
	mapEventID = require(`../../data/EventIDMap/${C.hero}.json`);
}
catch(error) {
	mapEventID = {};
}

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
		const arrSoundEntry = arrEntryAll.filter(entry => entryParsed.soundIDs.indexOf(entry.id) > -1);

		for(const soundEntry of arrSoundEntry) {
			result.push(soundEntry.audioID);
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
		L(`[WARNING] Unknown action sound entry ${hircID}`);
	}
	else {
		L(`[WARNING] Unknown action sound entry Type`);
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

module.exports = async function readBnk(bnkPath, eventNameSet) {
	L(`[Main] Read Bnk [${_pa.parse(bnkPath).base}]`);

	const bnkBiffer = Biffer(bnkPath);

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
				L(magic);
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
			L(`[WARNING] Unknown [Hirc Event ID] ${hircEvent.id}`);

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

	return mapAudioID_EventName;
};
