import { C, G } from '@nuogz/pangu';

import { appendFileSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import Biffer from '@nuogz/biffer';

import { dirDebug } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { toHexL8, showID, toBufferHex } from '../../lib/utility.js';

import { HIRCSound, HIRCEventAction, HIRCEvent, HIRCContainer, HIRCSwitchContainer, HIRCObject, HIRCSwitch } from '../entry/bnk/HIRCObject.js';



const fnv_1 = name => {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};


// /** @param {Biffer} B */
// const unpackVar = B => {
// 	let [cur] = B.unpack('B');
// 	let value = (cur & 0x7F);

// 	let max = 0;
// 	while(cur & 0x80 && max < 10) {
// 		cur = B.unpack('B');
// 		value = (value << 7) | (cur & 0x7F);
// 		max += 1;
// 	}

// 	if(max >= 10) { throw 'unexpected variable loop count'; }

// 	return value;
// };


// 7: Actor Mixer
// 14: Attenuation
// 17: Motion FX
const typesObjectHIRCSkip = [7, 14, 17];


const formats$idBundleProp = {
	[0x00]: 'f', // Volume
	[0x01]: 'f', // *LFE
	[0x02]: 'f', // Pitch
	[0x03]: 'f', // LPF (Low-pass Filter)
	[0x04]: 'f', // *HPF (High-pass Filter)
	[0x05]: 'f', // Bus Volume
	[0x06]: 'f', // Make Up Gain
	[0x07]: 'I', // Priority
	[0x08]: 'f', // Priority Distance Offset
	[0x09]: 'f', // *Feedback Volume (removed)
	[0x0A]: 'f', // *Feedback LPF (removed)
	[0x0B]: 'f', // Mute Ratio
	[0x0C]: 'f', // PAN_LR
	[0x0D]: 'f', // PAN_FR
	[0x0E]: 'f', // *Center PCT
	[0x0F]: 'f', // *Delay Time
	[0x10]: 'f', // *Transition Time
	[0x11]: 'f', // *Probability
	[0x12]: 'f', // *Dialogue Mode
	[0x13]: 'f', // User Aux Send Volume 0
	[0x14]: 'f', // User Aux Send Volume 1
	[0x15]: 'f', // User Aux Send Volume 2
	[0x16]: 'f', // User Aux Send Volume 3
	[0x17]: 'f', // Game Aux Send Volume
	[0x18]: 'f', // Output Bus Volume
	[0x19]: 'f', // *Output Bus HPF
	[0x1A]: 'f', // *Output Bus LPF
	[0x1B]: 'f', // *HDR Bus Threshold
	[0x1C]: 'f', // *HDR Bus Ratio
	[0x1D]: 'f', // *HDR Bus Release Time
	[0x1E]: 'f', // *HDR Bus Game Param
	[0x1F]: 'f', // *HDR Bus Game Param Min
	[0x20]: 'f', // *HDR Bus Game Param Max
	[0x21]: 'f', // *HDR Active Range
	[0x22]: 'f', // *Loop Start
	[0x23]: 'f', // *Loop End
	[0x24]: 'f', // *Trim In Time
	[0x25]: 'f', // *Trim Out Time
	[0x26]: 'f', // *Fade In Time
	[0x27]: 'f', // *Fade Out Time
	[0x28]: 'f', // *Fade In Curve
	[0x29]: 'f', // *Fade Out Curve
	[0x2A]: 'f', // *Loop Crossfade Duration
	[0x2B]: 'f', // *Crossfade Up Curve
	[0x2C]: 'f', // *Crossfade Down Curve
	[0x2D]: 'f', // *MIDI Tracking Root Note
	[0x2E]: 'f', // *MIDI Play On Note Type
	[0x2F]: 'f', // *MIDI Transposition
	[0x30]: 'f', // *MIDI Velocity Offset
	[0x31]: 'f', // *MIDI Key Range Min
	[0x32]: 'f', // *MIDI Key Range Max
	[0x33]: 'f', // *MIDI Velocity Range Min
	[0x34]: 'f', // *MIDI Velocity Range Max
	[0x35]: 'f', // *MIDI Channel Mask
	[0x36]: 'f', // *Playback Speed
	[0x37]: 'f', // *Midi Tempo Source
	[0x38]: 'f', // *Midi Target Node
	[0x39]: 'I', // *Attached Plugin Effect ID
	[0x3A]: 'f', // *Loop
	[0x3B]: 'f', // *Initial Delay
	[0x3C]: 'f', // *User Aux Send LPF 0
	[0x3D]: 'f', // *User Aux Send LPF 1
	[0x3E]: 'f', // *User Aux Send LPF 2
	[0x3F]: 'f', // *User Aux Send LPF 3
	[0x40]: 'f', // *User Aux Send HPF 0
	[0x41]: 'f', // *User Aux Send HPF 1
	[0x42]: 'f', // *User Aux Send HPF 2
	[0x43]: 'f', // *User Aux Send HPF 3
	[0x44]: 'f', // *Game Aux Send LPF
	[0x45]: 'f', // *Game Aux Send HPF
	[0x46]: 'I', // *Attenuation ID
	[0x47]: 'f', // *Positioning Type Blend
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
		const [
			// 0000 0000 0000 0000 0000 0000 0000 1111 = type
			// 0000 0000 0000 0000 0011 1111 1111 0000 = company
			idPlugin,
			typeStream,
			idAudio,
			sizeMediaInMemory,
			// 0000 0001 = specificedLanguage
			// 0000 0010 = prefetched
			// 0000 1000 = nonCachable
			// 1000 0000 = hasSource
			bitsSource,
		] = B.unpack('IBIIB');

		const sound = object = new HIRCSound(id, typeStream, idAudio);

		sound.idPlugin = idPlugin;
		sound.sizeMediaInMemory = sizeMediaInMemory;
		sound.bitsSource = bitsSource;


		const typePlugin = idPlugin & 0x0F;
		const hasParam = typePlugin == 2;

		if(hasParam) {
			G.warnD(`parse ~[HIRC Object]~{${showID(id)}}`, `~[Sound] object include Plugin Prarams`, 'time to handle it!');
		}
	}
	// Event Action
	else if(type == 3) {
		const [scope, actionType, idObject, countParam] = B.unpack('BBIxB');
		object = new HIRCEventAction(id, scope, actionType, idObject, countParam);

		object.scope = scope;
		object.actionType = actionType;
		object.idObject = idObject;

		const params = object.params = [];

		for(let i = 0; i < countParam; i++) {
			const [type] = B.unpack('B');
			// 0f --> float
			const [value] = B.unpack(type == 0x0E || type == 0x0F ? 'I' : 'I');

			params.push({ type, value });
		}


		if(actionType == 0x12 || actionType == 0x19) {
			const [idGroup, idCondition] = B.unpack('xII');

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
			object.idsAction = B.unpack(`${count}I`);
		}
		else {
			object.idsAction = [];
		}
	}
	// Containers
	else if([5, 6, 9].includes(type)) {
		const container = object = new HIRCContainer(id);


		const [overridedParentEffect, sizeEffects] = B.unpack('BB');

		container.overridedParentEffect = Boolean(overridedParentEffect);

		if(sizeEffects) {
			// 0000 0001 = bypass effect 0
			// 0000 0010 = bypass effect 1
			// 0000 0100 = bypass effect 2
			// 0000 1000 = bypass effect 3
			// 0001 0000 = bypass all
			container.bitsBypassEffect = B.unpack('B');

			container.effects = [];
			for(let index = 0; index < sizeEffects; index++) {
				const [index, idEffect, sharedSet, rendered] = B.unpack('BIBB');

				container.effects.push({ index, idEffect, sharedSet: Boolean(sharedSet), rendered: Boolean(rendered), });
			}
		}


		const [overridedAttachmentParams, idBusOverride, idParent, bitsSettings] = B.unpack('BIIB');

		container.overridedAttachmentParams = Boolean(overridedAttachmentParams);
		container.idBusOverride = idBusOverride;
		container.idParent = idParent;
		// 0000 0001 = prioritizedOverrideParent
		// 0000 0010 = prioritizedApplyDistFactor
		// 0000 0100 = overridedMIDIEventsBehavior
		// 0000 1000 = overridedMIDINoteTracking
		// 0001 0000 = enabledMIDINoteTracking
		// 0010 0000 = breakedMIDILoopOnNoteOff
		container.bitsSettings = bitsSettings;


		const [sizeBundlesProp] = B.unpack('B');

		container.bundlesProp = B.unpack(`${sizeBundlesProp}B`).map(id => ({ id }));

		for(const bundleProp of container.bundlesProp) {
			if(!formats$idBundleProp[bundleProp.id]) {
				G.warnD(`parse ~[HIRC Object]~{${showID(id)}}`, 'unknown ~[Prop Bundle ID]', `~{${bundleProp.id}}`);
			}

			[bundleProp.value] = B.unpack(formats$idBundleProp[bundleProp.id]);
		}


		const [sizeBundlesPropRanged] = B.unpack('B');

		container.bundlesPropRanged = B.unpack(`${sizeBundlesPropRanged}B`).map(id => ({ id }));

		for(const bundleProp of container.bundlesPropRanged) {
			[bundleProp.min, bundleProp.max] = B.unpack('ff');
		}


		// 0000 0001 = hasPositioningInfoOverrideParent
		// 0000 0010 = hasListenerRelativeRouting
		// 0000 1100 = Panner Type: 0, Direct Speaker Assignment,; 1, Balance Fade Height; 2, Steering Panner
		// 0110 0000 = 3DPosition Type: 0, Emitter; 1, Emitter With Automation; 2, Listener With Automation
		[container.positioning] = B.unpack('B');
		const hasPositioning = (container.positioning >> 0) & 1;
		const has3D = (container.positioning >> 1) & 1;

		if(hasPositioning && has3D) {
			// 0000 0011 = Spatialization Mode: 0, None; 1, Position Only; 2, Position And Orientation
			// 0000 0100 = enabledAttenuation
			// 0000 1000 = holdedEmitterPosAndOrient
			// 0001 0000 = holdedListenerOrient
			// 0100 0000 = is not looping?
			[container.bits3D] = B.unpack('B');

			const type3DPosition = (container.positioning >> 5) & 3;
			const hasAutomation = type3DPosition != 0; //#(3d == 1 or 3d != 1 and 3d == 2)

			if(hasAutomation) {
				// 0x0 = Step Sequence
				// 0x1 = Step Random
				// 0x2 = Continuous Sequence
				// 0x3 = Continuous Random
				// 0x4 = Step Sequence Pick New Path
				// 0x5 = Step Random Pick New Path
				[container.modePath] = B.unpack('B');

				[container.timeTransition] = B.unpack('i');

				const sizeVertices = B.unpack('I');
				container.vertices = [];
				for(let index = 0; index < sizeVertices; index++) {
					const [x, y, z, duration] = B.unpack('fffi');

					container.vertices.push({ x, y, z, duration });
				}

				const sizeItemsPlayList = B.unpack('I');
				container.itemsPlayList = [];
				for(let index = 0; index < sizeItemsPlayList; index++) {
					const [offsetVertices, sizeVertices] = B.unpack('II');

					container.itemsPlayList.push({ offsetVertices, sizeVertices });
				}

				container.paramsAutomation = [];
				for(let index = 0; index < sizeItemsPlayList; index++) {
					const [xRange, yRange, zRange] = B.unpack('ff');

					container.paramsAutomation.push({ xRange, yRange, zRange });
				}
			}
		}


		// 0000 0100 = overridedUserAuxSends
		// 0000 1000 = hasAux
		// 0001 0000 = overridedReflectionsAuxBus
		[container.bitsAux] = B.unpack('B');

		const hasAux = (container.bitsAux >> 3) & 1;
		if(hasAux) {
			container.idsAux = B.unpack('IIII');
		}


		[
			// 0000 0001 = Killed Newest
			// 0000 0010 = UseedVirtualBehavior
			// 0000 1000 = Ignore Parent Max Num Instance
			// 0001 0000 = Is Voices Option Override Parent
			container.bitsAdvSettings,
			container.behaviorVirtualQueue,
			container.sizeInstanceMax,
			container.behaviorBelowThreshold,
			// 0000 0001 = overridedHdrEnvelope
			// 0000 0010 = overridedAnalysis
			// 0000 0100 = normalizedLoudness
			// 0000 1000 = enabledEnvelope
			container.bitsAdvSettings2
		] = B.unpack('BBHBB');


		const [sizePropsState] = B.unpack('B');
		if(sizePropsState) {
			G.warnD(`parse ~[HIRC Object]~{${showID(id)}}`, `found ~[sizePropsState] is ${sizePropsState}`, 'time to handle it!');
			container.propsState = [];
		}

		const [sizeChunksState] = B.unpack('B');
		if(sizeChunksState) {
			G.warnD(`parse ~[HIRC Object]~{${showID(id)}}`, `found ~[sizeChunksState] is ${sizeChunksState}`, 'time to handle it!');
			container.chunksState = [];
		}

		const [sizeRTPC] = B.unpack('H');
		if(sizeRTPC) {
			G.warnD(`parse ~[HIRC Object]~{${showID(id)}}`, `found ~[sizeRTPC] is ${sizeRTPC}`, 'time to handle it!');
			container.rtpcs = [];
		}


		if(type == 5) {
			[
				container.countLoop,
				container.modLoopMin,
				container.modLoopMax,
				container.timeTransition,
				container.modTimeTransitionMin,
				container.modTimeTransitionMax,
				container.countRepeatAvoid,
				// 0x0: "Disabled",
				// 0x1: "CrossFadeAmp",
				// 0x2: "CrossFadePower",
				// 0x3: "Delay",
				// 0x4: "SampleAccurate",
				// 0x5: "TriggerRate",
				container.modeTransition,
				// 0x0: "Normal",
				// 0x1: "Shuffle",
				container.modeRandom,
				// 0x0: "Random",
				// 0x1: "Sequence",
				container.mode,
				// 0000 0001 = isUsingWeight
				// 0000 0010 = resetedPlayListAtEachPlay
				// 0000 0100 = isRestartBackward
				// 0000 1000 = isContinuous
				// 0001 0000 = isGlobal
				container.bitsParam
			] = B.unpack('HHHfffHBBBB');


			container.typeName = container.mode == 0 ? 'Sequence Container' : 'Random Container';
		}
		else if(type == 6) {

			[
				// 0x0: "Switch",
				// 0x1: "State",
				container.typeGroup,
				container.idGroup,
				container.idSwitchDefault,
				container.validatedContinuous,
			] = B.unpack('BIIB');


			object.typeName = 'Switch Container';
		}
		else if(type == 9) {
			G.warnD(`parse ~[HIRC Object]~{${showID(id)}}`, `found ~[Layer Container]`, 'time to handle it!');
		}


		const [sizeChildren] = B.unpack('I');
		object.idsSound = B.unpack(`${sizeChildren}I`);

		if(sizeChildren > 1 && type == 5) { object.typeName += ` ${sizeChildren}`; }


		if(type == 5) {
			object.idsChildren = object.idsSound;

			const [sizePlayList] = B.unpack('H');

			object.idsSound = [];
			object.weightsSound = [];
			for(let index = 0; index < sizePlayList; index++) {
				object.idsSound.push(B.unpack(`I`)[0]);
				object.weightsSound.push(B.unpack(`I`)[0]);
			}
		}
		else if(type == 6) {
			const [sizeSwitches] = B.unpack('I');

			object.switches = [];
			for(let index = 0; index < sizeSwitches; index++) {
				const [id, sizeSwitch] = B.unpack(`II`);

				const sw = new HIRCSwitch(id, B.unpack(`${sizeSwitch}I`));

				object.switches.push(sw);
				objectsExtra.push(sw);
			}
		}
	}
	else if(!typesObjectHIRCSkip.includes(type)) {
		G.errorD(`parse ~[HIRC Object]~{${showID(id)}}`, `unhandled ~[HIRC Object]`, `type~{${type}}`);

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
		result.push(objectParsed.idAudio);
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
		G.warnD('parseActionSoundObject', 'unknown ~[Action Object ID]', `~{${showID(idHIRC)}}`);
	}
	else if(objectParsed) {
		G.warnD('parseActionSoundObject', 'unknown ~[Action sound Object]', objectParsed);
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
	G.infoU('parseBNK', `parse ~{${parse(fileBNK).base}}`, '○ parsing...');

	const bifferBNK = new Biffer(fileBNK);

	const objects = [];
	const linesHexDump = [];

	while(!bifferBNK.isEnd()) {
		const [tagSection, sizeSection] = bifferBNK.unpack('4sI');

		// Hierarchy
		if(tagSection == 'HIRC') {
			const bifferSection = bifferBNK.sub(sizeSection);

			const [countObject] = bifferSection.unpack('I');

			for(let index = 0; index < countObject; index++) {
				const [type, length, id] = bifferSection.unpack('BII');

				G.traceD(`parse ~[HIRC Object]~{${showID(id)}}`, '~[HIRC Header]', `~[Position]~{${toHexL8(bifferSection.tell() + 10, null, false)}} ~[Type]~{${type}} ~[Length]~{${length}}`);

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
		// Bank Header
		else if(tagSection == 'BKHD') {
			const [
				version,
				idBank,
				/* idLanguage */,
				// 0000 0000 0000 0000 1111 1111 1111 1111 = unused
				// 1111 1111 1111 1111 0000 0000 0000 0000 = allocatedDevice
				/* bitsValuesAlt */,
				idProject
			] = bifferBNK.unpack('5L');

			const gap = sizeSection - Biffer.calc('5L');
			if(gap > 0) { bifferBNK.skip(gap); }


			if(version != 134) {
				G.errorD('parseBNK', 'unexpected ~[Bank Version]', `~{${version}}`);

				throw Error(`unexpected ~[Bank Version]~{${version}}`);
			}

			G.debugD('parseBNK', '~[Bank Header]', `~[Version]~{${version}} ~[Bank ID]~{${toHexL8(idBank)}} ~[Project ID]~{${toHexL8(idProject)}}`);
		}
		else {
			bifferBNK.skip(sizeSection);

			G.warnD('parseBNK', 'unhandled ~[Bank Section Tag]', `~{${tagSection}}`);
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

		let eventFull = mapHash_EventName[objectEvent.id];

		if(!eventFull) {
			G.warnD('parseBNK', 'unmatched ~[HIRC Event ID]', `~{${objectEvent.id}}`);

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

		for(const idAudio of eventsAudio) {
			(namesEventAll$idAudio[idAudio] || (namesEventAll$idAudio[idAudio] = new Set())).add(eventFull);
		}
	}

	const idsSoundAll$idAudio = {};

	objects.filter(object => object instanceof HIRCSound).forEach(sound =>
		(idsSoundAll$idAudio[sound.idAudio] || (idsSoundAll$idAudio[sound.idAudio] = new Set())).add(sound.id)
	);


	// extract debug info

	// const textsSoundAudio = [];
	// objects.filter(object => object instanceof HIRCSound).forEach(object =>
	// 	textsSoundAudio.push(`${showID(object.id)} --> ${showID(object.idAudio)}`)
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


	G.infoD('parseBNK', `parse ~{${parse(fileBNK).base}}`, '✔ ');

	return [namesEventAll$idAudio, idsSoundAll$idAudio];
}
