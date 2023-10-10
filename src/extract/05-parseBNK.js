import { appendFileSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { readJSONSync } from '../../lib/fs-extra.js';

import { C, G } from '@nuogz/pangu';
import Biffer from '@nuogz/biffer';

import { dirDebug } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { toHexL8, showID, toBufferHex } from '../../lib/utility.js';

import { HIRCSound, HIRCEventAction, HIRCEvent, HIRCContainer, HIRCSwitchContainer, HIRCObject, HIRCSwitch } from '../entry/bnk/HIRCObject.js';



let mapEventID = {};
try {
	mapEventID = readJSONSync(`../../data/EventIDMap/${I.slot}.json`);
}
catch(error) { void 0; }

const getEventFull = (mapHash_EventName, HIRCEventID) => {
	let eventFull = mapHash_EventName[HIRCEventID];

	while(!eventFull && mapEventID[HIRCEventID]) {
		eventFull = mapHash_EventName[HIRCEventID = mapEventID[HIRCEventID]];
	}

	return eventFull;
};



const fnv_1 = name => {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};



// 7: Actor Mixer
// 14: Attenuation
// 17: Motion FX
const typesUnused = [7, 14, 17];


const formats$typeParamAdditional = {
	[0x00]: 'f',
	[0x02]: 'f',
	[0x03]: 'f',
	[0x05]: 'f',
	[0x06]: 'f',
	[0x07]: 'I',
	[0x08]: 'f',
	[0x0B]: 'f',
	[0x0C]: 'f',
	[0x0D]: 'f',
	[0x12]: 'f',
	[0x13]: 'f',
	[0x14]: 'f',
	[0x15]: 'f',
	[0x16]: 'f',
	[0x17]: 'f',
	[0x18]: 'f',
	[0x3B]: 'I',// not sure
	[0x46]: 'I',// not sure
};


/**
 * @param {number} id
 * @param {number} type
 * @param {Biffer} B
 */
export const parseHIRCObject = (id, type, B) => {
	let object;
	const objectsExtra = [];

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
		const [scope, actionType, idObject, countParam] = B.unpack('BBLxB');
		object = new HIRCEventAction(id, scope, actionType, idObject, countParam);

		object.scope = scope;
		object.actionType = actionType;
		object.idObject = idObject;

		const params = object.params = [];

		for(let i = 0; i < countParam; i++) {
			const [type] = B.unpack('B');
			// 0f --> float
			const [value] = B.unpack(type == 0x0E || type == 0x0F ? 'L' : 'L');

			params.push({ type, value });
		}


		if(actionType == 0x12 || actionType == 0x19) {
			const [idGroup, idCondition] = B.unpack('xLL');

			object.idGroup = idGroup;
			object.idCondition = idCondition;
		}
	}
	// Event
	else if(type == 4) {
		const [count] = B.unpack('B');

		object = new HIRCEvent(id, count);

		object.count = count;

		if(count) {
			object.idsAction = B.unpack(`${count}L`);
		}
		else {
			object.idsAction = [];
		}
	}
	// Containers
	else if([5, 6, 9].includes(type)) {
		object = new HIRCContainer(id);


		// override parent settings or not
		// number of effects
		const [overrided, countEffects] = B.unpack('BB');

		object.overrided = ~~overrided;

		if(countEffects) {
			// bypassed effect mask
			B.skip(1);

			for(let index = 0; index < countEffects; index++) {
				B.skip(0
					+ 1 // effect index
					+ 4 // effect id
					+ 2 // 00 00
				);
			}
		}

		B.skip(0
			+ 1 // 00
			+ 4 // output bus id
			+ 4 // parent object id
			+ 1 // undetect, 00, or override parent settings, or activate offset priority at max distance
		);


		// number of additional parameter
		const [countParams] = B.unpack('B');

		// types of each additional parameter
		object.params = B.unpack(`${countParams}B`).map(type => ({ type }));

		for(const param of object.params) {
			if(!formats$typeParamAdditional[param.type]) {
				G.debug('BNKParser', 'unknown ~[additional param type]', `~{${param.type}}`);
			}

			[param.value] = B.unpack(formats$typeParamAdditional[param.type]);
		}


		const [d1, d2] = B.unpack('BB');
		// d1 may be a unknown boolean
		if(d1 > 1) { G.debug('BNKParser', 'match undetect data ~[1.bool]', `~{${d1}}`); }
		// d2 should be a byte parameter
		// if d2 > 0, 1 byte following parameter
		if(d2 > 0) { B.unpack('B'); }

		const [d3, d4, d5, d6, d7, d8] = B.unpack('BBBBBB');
		// d3 may be a unknown boolean
		if(d3 > 1) { G.debug('BNKParser', 'match undetect data ~[d3.bool]', `~{${d3}}`); }
		// d4 may be a unknown boolean
		if(d4 > 1) { G.debug('BNKParser', 'match undetect data ~[d4.bool]', `~{${d4}}`); }
		// d5 may be a unknown boolean
		if(d5 > 1) { G.debug('BNKParser', 'match undetect data ~[d5.bool]', `~{${d5}}`); }
		// d6 may be a unknown boolean
		if(d6 > 1) { G.debug('BNKParser', 'match undetect data ~[d6.bool]', `~{${d6}}`); }
		// d7 may be a unknown boolean
		if(d7 > 1) { G.debug('BNKParser', 'match undetect data ~[d7.bool]', `~{${d7}}`); }
		// d8 may be a unknown boolean
		if(![0, 1, 2].includes(d8)) { G.debug('BNKParser', 'match undetect data ~[d8.byte]', `~{${d8}}`); }


		if(type == 5) {



			const [d9] = B.unpack('B');
			if(![0, 8].includes(d9)) { G.debug('BNKParser', 'match undetect data ~[5.d9.byte]', `~{${d9}}`); }


			const textUndetectLong = toBufferHex(B.slice(22));

			if(textUndetectLong !=
				'00 00 00 00 01 00 00 00 00 00 00 00 7A 44 00 00 00 00 00 00 00 00') {
				G.debug('BNKParser', 'match undetect data ~[5.long]', '✖', d8, textUndetectLong);
			}


			const [h1, h2] = B.unpack('>xxHH');
			if(h1 > 1) { G.debug('BNKParser', 'match undetect data ~[5.h1]', `~{${h1}}`); }
			if(![18, 274, 282].includes(h2)) { G.debug('BNKParser', 'match undetect data ~[5.h2]', `~{${h2}}`); }

			object.typeName = h1 == 0 ? 'Sequence Container' : 'Random Container';
		}
		else if(type == 6) {
			object.typeName = 'Switch Container';

			const [d9] = B.unpack('B');
			if(![0, 8].includes(d9)) { G.debug('BNKParser', 'match undetect data ~[6.d9.byte]', `~{${d9}}`); }


			const textUndetectLong = toBufferHex(B.slice(5));

			if(textUndetectLong != '00 00 00 00 00') {
				G.debug('BNKParser', 'match undetect data ~[6.long]', '✖', textUndetectLong);
			}


			[object.idGroup, object.idSwitchDefault] = B.unpack('LLx');
		}
		else if(type == 9) {
			object.typeName = 'Blend Container';

			const textUndetectLong = toBufferHex(B.slice(5));

			if(textUndetectLong != '00 00 00 00 00') {
				G.debug('BNKParser', 'match undetect data ~[9.long]', '✖', textUndetectLong);
			}
		}


		// number of sound id
		const [countSound] = B.unpack('L');

		if(countSound > 1 && type == 5) { object.typeName += ` ${countSound}`; }

		// each sound ids
		try {
			object.idsSound = B.unpack(`${countSound}L`);
		}
		catch(error) {
			G.error('BNKParser', 'unpack container sound ids', error);
		}


		if(type == 5) {
			object.idsSoundUnorder = object.idsSound;


			const [countSoundOrder] = B.unpack('H');

			object.idsSound = [];
			for(let index = 0; index < countSoundOrder; index++) {
				object.idsSound.push(B.unpack(`L`)[0]);

				const textUndetectLong = toBufferHex(B.slice(4));
				if(textUndetectLong != '50 C3 00 00') { G.debug('BNKParser', 'match undetect data ~[t5.interval]', '✖', textUndetectLong); }
			}
		}
		else if(type == 6) {
			// number of switch
			const [countSwitch] = B.unpack('L');

			// each switch
			object.switches = [];
			for(let index = 0; index < countSwitch; index++) {
				// number of sound
				const [id, countSoundSwitch] = B.unpack(`LL`);

				// each sound ids
				const sw = new HIRCSwitch(id, B.unpack(`${countSoundSwitch}L`));

				object.switches.push(sw);
				objectsExtra.push(sw);
			}
		}
	}
	else if(!typesUnused.includes(type)) {
		G.error('HIRCObjectParser', `unknown HIRC Object Type: ${type} ${id}`);

		object = new HIRCObject(id, type);
	}


	return [object, objectsExtra];
};


/**
 * @param {HIRCObject} objectParsed
 * @param {HIRCObject[]} objectsAll
 * @param {number} idHIRC
 * @returns {number{}}
 */
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
		const objects = [...new Set([
			...objectsAll.filter(object => objectParsed.idsSound.includes(object.id)),
			...objectParsed.switches,
		])];

		for(const object of objects) {
			for(const eventAudio of parseActionSoundObject(object, objectsAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(objectParsed instanceof HIRCSwitch) {
		const objects = objectsAll.filter(object => objectParsed.idsSound.includes(object.id));

		for(const object of objects) {
			for(const eventAudio of parseActionSoundObject(object, objectsAll)) {
				result.push(eventAudio);
			}
		}
	}
	else if(!objectParsed && idHIRC) {
		G.warn('BNKParser', 'unknown ~[action object id]', `~{${showID(idHIRC)}}`);
	}
	else if(objectParsed) {
		G.warn('BNKParser', 'unknown ~[action sound object]', objectParsed);
	}

	return result;
};



const parseTree = (object, id, objects, texts, level = 0) => {
	if(!object) {
		if(id) { return texts.push(`${'\t'.repeat(level)}UnknownObject:${showID(id)}`); }

		return;
	}

	texts.push(`${'\t'.repeat(level)}${object.toString()}`);


	if(object instanceof HIRCEvent) {
		for(const idAction of object.idsAction) {
			parseTree(objects.find(o => o.id == idAction), idAction, objects, texts, level + 1);
		}

		texts.push('');
	}
	else if(object instanceof HIRCEventAction) {
		parseTree(objects.find(o => o.id == object.idObject), object.idObject, objects, texts, level + 1);
	}
	else if(
		object instanceof HIRCContainer ||
		object instanceof HIRCSwitchContainer ||
		object instanceof HIRCSwitch
	) {
		if(object instanceof HIRCSwitchContainer) {
			object.switches.forEach(sw => texts.push(`${'\t'.repeat(level + 1)}${sw.toString()}`));
		}

		for(const idSound of object.idsSound) {
			const objectChild = objects.find(e => e.id == idSound);

			parseTree(objectChild, idSound, objects, texts, level + 1);
		}
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
	const linesHexDump = [];

	while(!bifferBNK.isEnd()) {
		const [magicSection, sizeSection] = bifferBNK.unpack('4sL');

		if(magicSection == 'HIRC') {
			const bifferSection = bifferBNK.sub(sizeSection);

			const [countObject] = bifferSection.unpack('L');

			for(let i = 0; i < countObject; i++) {
				const [type, length, id] = bifferSection.unpack('BLL');

				G.trace('BNKParser', `HIRC object ~[${toHexL8(id)}]`, `~[position]~{${toHexL8(bifferSection.tell() + 10, null, false)}} ~[type]~{${type}} ~[length]~{${length}}`);

				const B = bifferSection.sub(length - 4);

				const [objectSection, objectsExtra] = parseHIRCObject(id, type, B);

				if(objectSection) { objects.push(objectSection); }

				objects.push(...objectsExtra);


				const idsHexObjectDump = C.debug?.idsHexObjectDump ?? [];
				if(idsHexObjectDump.includes(toHexL8(id)) || idsHexObjectDump.includes(id) || idsHexObjectDump.includes('*')) {
					linesHexDump.push(`${toHexL8(id)} [${String(type).padStart(2, '0')}]${objectSection ? objectSection.toString() : ''}\n${toBufferHex(B)}`);
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


	if(linesHexDump.length) {
		writeFileSync(
			resolve(dirDebug, 'hex', `${I.slot}@${C.server.region}@${C.lang}@${I.time}@hex.txt`),
			linesHexDump.join('\n'),
		);
	}


	const mapHash_EventName = {};
	const namesEventAll$idAudio = {};
	const mapAudioIDHex_EventName = {};

	for(const event of setNameEvent) {
		mapHash_EventName[fnv_1(event)] = event;
		mapAudioIDHex_EventName[toHexL8(fnv_1(event))] = event;
	}

	if(linesHexDump.length) {
		appendFileSync(
			resolve(dirDebug, 'hex', `${I.slot}@${C.server.region}@${C.lang}@${I.time}@hex.txt`),
			JSON.stringify(mapAudioIDHex_EventName, null, '\t') + '\n',
		);
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

		for(const actionID of objectEvent.idsAction) {
			const action = objects.find(object => object.id == actionID);

			const actionSoundObject = objects.find(object => object.id == action.idObject);

			for(const eventAudio of parseActionSoundObject(actionSoundObject, objects, action.idObject)) {
				eventsAudio.push(eventAudio);
			}
		}

		for(const audioID of eventsAudio) {
			(namesEventAll$idAudio[audioID] || (namesEventAll$idAudio[audioID] = new Set())).add(eventFull);
		}
	}

	const idsSoundAll$idAudio = {};

	objects.filter(object => object instanceof HIRCSound).forEach(sound =>
		(idsSoundAll$idAudio[sound.audioID] || (idsSoundAll$idAudio[sound.audioID] = new Set())).add(sound.id)
	);


	// extract debug info

	// const textsSoundAudio = [];
	// objects.filter(object => object instanceof HIRCSound).forEach(object =>
	// 	textsSoundAudio.push(`${showID(object.id)} --> ${showID(object.audioID)}`)
	// );

	// writeFileSync(
	// 	resolve(dirDebug, `[${I.slot}@${C.server.region}@${C.lang}]@${parse(fileBNK).base}@${I.time}@sound.txt`),
	// 	textsSoundAudio.join('\n')
	// );


	// const textsEvent = [];
	// objects.filter(object => object instanceof HIRCEvent)
	// 	.forEach(object =>
	// 		textsEvent.push(showID(object.id))
	// 	);

	// writeFileSync(
	// 	resolve(dirDebug, `[${I.slot}@${C.server.region}@${C.lang}]@${parse(fileBNK).base}@${I.time}@event.txt`),
	// 	textsEvent.join('\n')
	// );


	if(!C.debug?.skipDumpObjectTree) {
		const textsTree = [];
		for(const object of objects.filter(object => object instanceof HIRCEvent)) {
			parseTree(object, object.id, objects, textsTree);
		}

		writeFileSync(
			resolve(dirDebug, `[${I.slot}@${C.server.region}@${C.lang}]@${parse(fileBNK).base}@${I.time}@tree.txt`),
			textsTree.join('\n')
		);
	}


	G.infoD('BNKParser', `parse BNK~{${parse(fileBNK).base}}`, '✔ ');

	return [namesEventAll$idAudio, idsSoundAll$idAudio];
}
