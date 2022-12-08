import { writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { readJSONSync } from '../../lib/fs-extra.js';

import { C, G } from '@nuogz/pangu';
import Biffer from '@nuogz/biffer';

import { dirDebug } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { toHexL } from '../../lib/utility.js';

import { HIRCSound, HIRCEventAction, HIRCEvent, HIRCContainer, HIRCSwitchContainer, HIRCObject } from '../entry/bnk/HIRCObject.js';



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


const parseActionSoundObject = (objectParsed, objectsAll, idHIRC) => {
	const result = [];

	if(objectParsed instanceof HIRCSound) {
		result.push(objectParsed.audioID);
	}
	else if(objectParsed instanceof HIRCContainer) {
		const objects = objectsAll.filter(object => objectParsed.idsSound.includes(object.id));

		for(const object of objects) {
			for(const eventAudio of parseActionSoundObject(object, objectsAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(objectParsed instanceof HIRCSwitchContainer) {
		const objects = objectsAll.filter(object => objectParsed.idsSound.includes(object.id));

		for(const object of objects) {
			for(const eventAudio of parseActionSoundObject(object, objectsAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(!objectParsed) {
		G.warn('BNKParser', 'unknown ~[action sound object id]', idHIRC);
	}
	else {
		G.warn('BNKParser', 'unknown ~[action sound object]', objectParsed);
	}

	return result;
};



// 7: Actor Mixer
// 14: Attenuation
const typesUnused = [7, 14];

/**
 * @param {number} id
 * @param {number} type
 * @param {Biffer} B
 */
export const parseHIRCObject = (id, type, B) => {
	let object;

	// Sound
	if(type == 2) {
		const [embedType, audioID, sourceID] = B.unpack('xxxxBLL');

		object = new HIRCSound(id, embedType, audioID, sourceID);

		if(embedType == 0) {
			const [fileIndex, fileLength] = B.unpack('LL');

			object.fileIndex = fileIndex;
			object.fileLength = fileLength;
		}

		const [soundType] = B.unpack('L');

		object.soundType = soundType;
	}
	// Event Action
	else if(type == 3) {
		const [scope, actionType, idObject, paramCount] = B.unpack('BBLxB');

		object = new HIRCEventAction(id, scope, actionType, idObject, paramCount);

		object.scope = scope;
		object.actionType = actionType;
		object.idObject = idObject;
	}
	// Event
	else if(type == 4) {
		const [count] = B.unpack('B');

		object = new HIRCEvent(id, count);

		object.count = count;

		if(count) {
			object.eventActions = B.unpack(`${count}L`);
		}
	}
	// Container
	else if(type == 5) {
		object = new HIRCContainer(id);

		const b = new Biffer(Buffer.from([...B.target].reverse()));

		while(b.unpack('>L')[0] == 0xC350) {
			object.idsSound.push(b.unpack('>L')[0]);
		}

		object.idsSound.reverse();
	}
	// Switch Container
	else if(type == 6) {
		object = new HIRCSwitchContainer(id);

		const b = new Biffer(Buffer.from([...B.target].reverse()));

		while(b.unpack('LLBB').join('|') == '0|0|1|0') {
			object.idsSound.push(b.unpack('>L')[0]);
		}

		// while(b.unpack('>L')[0] == 0xC350) {
		// 	object.idsSound.push(b.unpack('>L')[0]);
		// }

		object.idsSound.reverse();
	}
	else if(!typesUnused.includes(type)) {
		G.error('HIRCObjectParser', `unknown HIRC Object Type: ${type} ${id}`);

		object = new HIRCObject(id, type);
	}


	return object;
};

const getEventFull = (mapHash_EventName, HIRCEventID) => {
	let eventFull = mapHash_EventName[HIRCEventID];

	while(!eventFull && mapEventID[HIRCEventID]) {
		eventFull = mapHash_EventName[HIRCEventID = mapEventID[HIRCEventID]];
	}

	return eventFull;
};

const parseContainerTree = (objectsAll, objectContainer, texts, level = 0) => {
	texts.push(`${'\t'.repeat(level)}${objectContainer instanceof HIRCContainer ? 'container' : 'switch-container'}:${objectContainer.id}|${toHexL(objectContainer.id, 8)}`);

	for(const idSound of objectContainer.idsSound) {
		const objectChild = objectsAll.find(e => e.id == idSound);

		if(objectChild instanceof HIRCSound) {
			const audioID = objectChild.audioID || 0;

			texts.push(`${'\t'.repeat(level + 1)}sound:${idSound}|${toHexL(idSound, 8)} audio:${audioID}|${toHexL(audioID, 8)}`);
		}
		else if(objectChild instanceof HIRCContainer || objectChild instanceof HIRCSwitchContainer) {
			parseContainerTree(objectsAll, objectChild, texts, level + 1);
		}
	}
	texts.push('');
};
const parseTree = (object, id, objects, texts, level = 0) => {
	if(!object) {
		return texts.push(`${'\t'.repeat(level)}UnknownObject:${id}|${toHexL(id, 8)}`);
	}

	texts.push(`${'\t'.repeat(level)}${object.__proto__.constructor.name}:${object.id}|${toHexL(object.id, 8)}`);

	if(object instanceof HIRCEvent) {
		texts[texts.length - 1] += ` --> name:${object.eventFull}`;

		for(const idAction of object.eventActions) {
			parseTree(objects.find(o => o.id == idAction), idAction, objects, texts, level + 1);
		}

		texts.push('');
	}
	else if(object instanceof HIRCEventAction) {
		parseTree(objects.find(o => o.id == object.idObject), object.idObject, objects, texts, level + 1);
	}
	else if(object instanceof HIRCContainer || object instanceof HIRCSwitchContainer) {
		for(const idSound of object.idsSound) {
			const objectChild = objects.find(e => e.id == idSound);

			parseTree(objectChild, idSound, objects, texts, level + 1);
		}
	}
	else if(object instanceof HIRCSound) {
		texts[texts.length - 1] += ` --> audio:${object.audioID}|${toHexL(object.audioID, 8)}`;
	}
};




/**
 * @param {string} fileBNK
 * @param {Set<string>} setNameEvent
 */
export default async function parseBNK(fileBNK, setNameEvent) {
	G.infoU('BNKParser', `parse BNK~{${parse(fileBNK).base}}`, 'parsing...');

	const bifferBNK = new Biffer(fileBNK);

	const objects = [];

	while(!bifferBNK.isEnd()) {
		const [magicSection, sizeSection] = bifferBNK.unpack('4sL');

		if(magicSection == 'HIRC') {
			const bifferSection = bifferBNK.sub(sizeSection);

			const [countObject] = bifferSection.unpack('L');

			for(let i = 0; i < countObject; i++) {
				const [type, length, id] = bifferSection.unpack('BLL');

				const objectSection = parseHIRCObject(id, type, bifferSection.sub(length - 4));

				if(objectSection) {
					objects.push(objectSection);
				}
			}
		}
		else {
			bifferBNK.skip(sizeSection);

			if(magicSection != 'BKHD') {
				G.warn('BNKParser', 'unknown ~[BNK section magic]', `~{${magicSection}}`);
			}
		}
	}



	const mapHash_EventName = {};
	const mapAudioID_EventName = {};

	for(const event of setNameEvent) {
		mapHash_EventName[fnv_1(event)] = event;
	}

	const objectsEvent = objects.filter(object => object instanceof HIRCEvent);

	for(const objectEvent of objectsEvent) {
		const eventsAudio = [];

		let eventFull = getEventFull(mapHash_EventName, objectEvent.id);

		if(!eventFull) {
			G.warn('BNKParser', 'unknown ~[HIRC Event ID]', `~{${objectEvent.id}}`);

			eventFull = objectEvent.id;
		}

		objectEvent.eventFull = eventFull;

		if(objectEvent.count) {
			for(const actionID of objectEvent.eventActions) {
				const action = objects.find(object => object.id == actionID);

				const actionSoundObject = objects.find(object => object.id == action.idObject);

				for(const eventAudio of parseActionSoundObject(actionSoundObject, objects, action.idObject)) {
					eventsAudio.push(eventAudio);
				}
			}
		}

		for(const audioID of eventsAudio) {
			(mapAudioID_EventName[audioID] || (mapAudioID_EventName[audioID] = new Set())).add(eventFull);
		}
	}

	const mapAudioID_SoundID = {};

	objects.filter(object => object instanceof HIRCSound).forEach(sound =>
		(mapAudioID_SoundID[sound.audioID] || (mapAudioID_SoundID[sound.audioID] = new Set())).add(sound.id)
	);


	// extract debug info
	const textsContainer = [];
	for(const object of objects.filter(object => object instanceof HIRCContainer || object instanceof HIRCSwitchContainer)) {
		parseContainerTree(objects, object, textsContainer);
	}

	writeFileSync(
		resolve(dirDebug, `[${I.slot}@${C.server.region}@${C.lang}]@${parse(fileBNK).base}@${I.time}@container.txt`),
		textsContainer.join('\n')
	);


	const textsSoundAudio = [];
	objects.filter(object => object instanceof HIRCSound).forEach(object =>
		textsSoundAudio.push(`${object.id}|${toHexL(object.id, 8)} --> ${object.audioID}|${toHexL(object.audioID, 8)}`)
	);

	writeFileSync(
		resolve(dirDebug, `[${I.slot}@${C.server.region}@${C.lang}]@${parse(fileBNK).base}@${I.time}@sound.txt`),
		textsSoundAudio.join('\n')
	);


	const textsEvent = [];
	objects.filter(object => object instanceof HIRCEvent)
		.forEach(object =>
			textsEvent.push(`${object.id}|${toHexL(object.id, 8)}`)
		);

	writeFileSync(
		resolve(dirDebug, `[${I.slot}@${C.server.region}@${C.lang}]@${parse(fileBNK).base}@${I.time}@event.txt`),
		textsEvent.join('\n')
	);


	const textsTree = [];
	for(const object of objects.filter(object => object instanceof HIRCEvent)) {
		parseTree(object, object.id, objects, textsTree);
	}
	writeFileSync(
		resolve(dirDebug, `[${I.slot}@${C.server.region}@${C.lang}]@${parse(fileBNK).base}@${I.time}@tree.txt`),
		textsTree.join('\n')
	);


	G.infoD('BNKParser', `parse BNK~{${parse(fileBNK).base}}`, '✔ ');

	return [mapAudioID_EventName, mapAudioID_SoundID];
}
