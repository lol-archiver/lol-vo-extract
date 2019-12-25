const HircSound = require('../entry/bnk/HircSound');
const HircEvent = require('../entry/bnk/HircEvent');
const HircPool = require('../entry/bnk/HircPool');

const parseHircEntry = require('../parser/bnk/hircEntry');

const fnv_1 = function(name) {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};

module.exports = async function readBnk(bnkPath, eventNameSet) {
	L(`[Main] Read Bnk [${_pa.parse(bnkPath).base}]`);

	const bnkBiffer = Biffer(bnkPath);

	const entryArr = [];

	while(!bnkBiffer.isEnd()) {
		const [magic, sectionSize] = bnkBiffer.unpack('4sL');

		if(magic == 'HIRC') {
			const sectionBiffer = bnkBiffer.sub(sectionSize);

			const [count] = sectionBiffer.unpack('L');

			for(let i = 0; i < count; i++) {
				const [type, length, id] = sectionBiffer.unpack('BLL');

				const entry = parseHircEntry(type, id, sectionBiffer.sub(length - 4));

				if(entry) {
					entryArr.push(entry);
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

	const hircEventArr = entryArr.filter(entry => entry instanceof HircEvent);

	for(const hircEvent of hircEventArr) {
		const arrEventAudio = [];

		let eventFull = mapHash_EventName[hircEvent.id];

		if(!eventFull) {
			L(`[WARNING] Unknown [Hirc Event ID] ${hircEvent.id}`);

			eventFull = hircEvent.id;
		}

		if(hircEvent.count) {
			for(const actionID of hircEvent.eventActions) {
				const action = entryArr.find(entry => entry.id == actionID);

				const actionSoundEntry = entryArr.find(entry => entry.id == action.hircID);

				if(actionSoundEntry instanceof HircSound) {
					arrEventAudio.push(actionSoundEntry.audioID);
				}
				else if(actionSoundEntry instanceof HircPool) {
					const arrSoundEntry = entryArr.filter(entry => actionSoundEntry.soundIDs.indexOf(entry.id) > -1);

					for(const soundEntry of arrSoundEntry) {
						arrEventAudio.push(soundEntry.audioID);
					}
				}
				else if(!actionSoundEntry) {
					L(`[WARNING] Unknown action sound entry`);
				}
				else {
					L(`[WARNING] Unknown action sound entry Type`);
				}
			}
		}

		for(const audioID of arrEventAudio) {
			(mapAudioID_EventName[audioID] || (mapAudioID_EventName[audioID] = new Set())).add(eventFull);
		}
	}

	return mapAudioID_EventName;
};
