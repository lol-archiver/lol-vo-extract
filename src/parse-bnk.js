import { G } from '@nuogz/pangu';

import { appendFileSync, writeFileSync } from 'fs';
import { parse as parsePath, resolve } from 'path';

import Biffer from '@nuogz/biffer';

import { T, TS } from '../lib/i18n.js';
import { toHexL8, showID, toBufferHex, TLogError, StackError } from '../lib/utility.js';

import { HIRCSound, HIRCEventAction, HIRCEvent, HIRCContainer, HIRCSwitchContainer, HIRCObject, HIRCSwitch } from './entry/bnk/HIRCObject.js';



/**
 * @param {string} name
 * @returns {bigint}
 */
const fnv_1 = name => {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};


/** @param {Biffer} B */
const unpackVariableNumber = B => {
	let [cur] = B.unpack('B');
	let value = (cur & 0x7F);

	let max = 0;
	while(cur & 0x80 && max < 10) {
		cur = B.unpack('B');
		value = (value << 7) | (cur & 0x7F);
		max += 1;
	}

	if(max >= 10) { throw TLogError('unpack-variablenumber', 'unexpected-loop'); }


	return value;
};


// 1: State
// 7: Actor Mixer
// 14: Attenuation
// 16: Fx Share Set
// 17: Motion FX
const typesObjectHIRCSkip = [1, 7, 14, 16, 17];


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
 * @param {number} idSection
 * @param {number} typeSection
 * @param {Biffer} B
 * @param {import('../bases.js').Melinoe} GG
 */
export const parseHIRCObject = (idSection, typeSection, B, GG) => {
	let object;
	const objectsExtra = [];

	// Sound
	if(typeSection == 2) {
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

		const sound = object = new HIRCSound(idSection, typeStream, idAudio);

		sound.idPlugin = idPlugin;
		sound.sizeMediaInMemory = sizeMediaInMemory;
		sound.bitsSource = bitsSource;


		const typePlugin = idPlugin & 0x0F;
		const hasParam = typePlugin == 2;


		if(hasParam) { GG.warnD(...TS(`parse-bnk:parse-hirc`, { id: showID(idSection) }, '! Found a ~[HIRCSound] includes plugin-params. Time to parse it!')); }
	}
	// Event Action
	else if(typeSection == 3) {
		const [scope, actionType, idObject, countParam] = B.unpack('BBIxB');
		object = new HIRCEventAction(idSection, scope, actionType, idObject, countParam);

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
	else if(typeSection == 4) {
		const [count] = B.unpack('B');

		object = new HIRCEvent(idSection, count);

		object.count = count;

		if(count) {
			object.idsAction = B.unpack(`${count}I`);
		}
		else {
			object.idsAction = [];
		}
	}
	// Containers
	else if([5, 6, 9].includes(typeSection)) {
		const container = object = new HIRCContainer(idSection);


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
			for(let indexEffect = 0; indexEffect < sizeEffects; indexEffect++) {
				const [index, idEffect, sharedSet, rendered] = B.unpack('BIBB');

				container.effects.push({ index, idEffect, sharedSet: Boolean(sharedSet), rendered: Boolean(rendered) });
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
				GG.warnD(...TS(`parse-bnk:parse-hirc`, { id: showID(idSection), idBunlde: bundleProp.id }, 'unknown-prop-bundle'));
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
					const [offsetVertices, sizeVerticesPlayList] = B.unpack('II');

					container.itemsPlayList.push({ offsetVertices, sizeVertices: sizeVerticesPlayList });
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
			container.propsState = [];

			for(let indexPropState = 0; indexPropState < sizePropsState; indexPropState++) {
				const id = unpackVariableNumber(B);

				const [typeAccum, dbIn] = B.unpack('BB');

				container.propsState.push({ id, typeAccum, dbIn });
			}
		}

		const [sizeChunksState] = B.unpack('B');
		if(sizeChunksState) {
			container.chunksState = [];

			for(let indexChunkState = 0; indexChunkState < sizeChunksState; indexChunkState++) {
				const [id, typeSyncState] = B.unpack('LB');

				const states = [];
				const sizeStates = unpackVariableNumber(B);
				for(let indexState = 0; indexState < sizeStates; indexState++) {
					const [idState, idInstanceState] = B.unpack('LL');

					states.push({ id: idState, idInstanceState });
				}


				container.chunksState.push({ id, typeSyncState, states });
			}
		}

		const [sizeRTPC] = B.unpack('H');
		if(sizeRTPC) {
			container.rtpcs = [];

			for(let index = 0; index < sizeRTPC; index++) {
				const [idRTPC, type, accum] = B.unpack('LBB');

				const idParam = unpackVariableNumber(B);

				const [idCurveRTPC, scaling, sizeGraphPoint] = B.unpack('LBH');

				const pointsGraph = [];

				for(let indexGraphPoint = 0; indexGraphPoint < sizeGraphPoint; indexGraphPoint++) {
					const [from, to, interp] = B.unpack('ffL');

					pointsGraph.push({ from, to, interp });
				}


				container.rtpcs.push({
					id: idRTPC,
					type,
					accum,
					idParam,
					idCurveRTPC,
					scaling,
					pointsGraph,
				});
			}
		}


		if(typeSection == 5) {
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


			container.typeName = container.mode == 0 ? 'Random Container' : 'Sequence Container';
		}
		else if(typeSection == 6) {
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
		else if(typeSection == 9) {
			object.typeName = 'Layer Container';
		}


		const [sizeChildren] = B.unpack('I');
		object.idsSound = B.unpack(`${sizeChildren}I`);

		if(sizeChildren > 1 && typeSection == 5) { object.typeName += ` ${sizeChildren}`; }


		if(typeSection == 5) {
			object.idsChildren = object.idsSound;

			const [sizePlayList] = B.unpack('H');

			object.idsSound = [];
			object.weightsSound = [];
			for(let index = 0; index < sizePlayList; index++) {
				object.idsSound.push(B.unpack(`I`)[0]);
				object.weightsSound.push(B.unpack(`I`)[0]);
			}
		}
		else if(typeSection == 6) {
			const [sizeSwitches] = B.unpack('I');

			object.switches = [];
			for(let index = 0; index < sizeSwitches; index++) {
				const [id, sizeSwitch] = B.unpack(`II`);

				const sw = new HIRCSwitch(id, B.unpack(`${sizeSwitch}I`));

				object.switches.push(sw);
				objectsExtra.push(sw);
			}
		}
		else if(typeSection == 9) {
			const [sizeLayers] = B.unpack('I');

			if(sizeLayers) {
				GG.warnD(...TS(`parse-bnk:parse-hirc`, { id: showID(idSection) }, '! Found a ~[Layer]. Time to parse it!'));
			}

			// object.layers = [];

			// for(let index = 0; index < sizeLayers; index++) { }

			// [object.isContinuous] = B.unpack('B');
		}
	}
	else if(!typesObjectHIRCSkip.includes(typeSection)) {
		GG.warnD(...TS(`parse-bnk:parse-hirc`, { id: showID(idSection), type: typeSection }, 'unparsed-type'));

		object = new HIRCObject(idSection, typeSection);
	}


	return [object, objectsExtra];
};


/**
 * @param {HIRCObject} objectParsed
 * @param {HIRCObject[]} objectsAll
 * @param {HIRCEventAction} action
 * @param {import('@nuogz/pangu').Melinoe} GG
 * @returns {number[]}
 */
const groupActionChildAudioIDs = (objectParsed, objectsAll, action, GG) => {
	const idsAudio = [];

	if(objectParsed instanceof HIRCSound) {
		idsAudio.push(objectParsed.idAudio);
	}
	else if(objectParsed instanceof HIRCContainer) {
		const objects = objectsAll.filter(object => objectParsed.idsSound.includes(object.id));

		for(const object of objects) {
			idsAudio.push(...groupActionChildAudioIDs(object, objectsAll, action, GG));
		}
	}
	else if(objectParsed instanceof HIRCSwitchContainer) {
		const objects = [...new Set([
			...objectsAll.filter(object => objectParsed.idsSound.includes(object.id)),
			...objectParsed.switches,
		])];

		for(const object of objects) {
			idsAudio.push(...groupActionChildAudioIDs(object, objectsAll, action, GG));
		}
	}
	else if(objectParsed instanceof HIRCSwitch) {
		const objects = objectsAll.filter(object => objectParsed.idsSound.includes(object.id));

		for(const object of objects) {
			idsAudio.push(...groupActionChildAudioIDs(object, objectsAll, action, GG));
		}
	}
	else if(!objectParsed) {
		GG.warnD(...TS('parse-bnk:group-ids-audio-action', { idAction: showID(action.id), idObject: showID(action.idObject) }, 'unknown-action-object'));
	}
	else if(objectParsed) {
		GG.warnD(...TS('parse-bnk:group-ids-audio-action', { idAction: showID(action.id), idObject: showID(action.idObject), clazz: Object.getPrototypeOf(objectParsed).constructor.name }, 'unknown-action-object-type'));
	}

	return idsAudio;
};



const joinTree = (object, id, objects, texts, level = 0) => {
	if(!object) {
		if(id) { return texts.push(`${'\t'.repeat(level)}UnknownObject:${showID(id)}`); }

		return;
	}

	texts.push(`${'\t'.repeat(level)}${object.toString()}`);


	if(object instanceof HIRCEvent) {
		for(const idAction of object.idsAction) {
			joinTree(objects.find(o => o.id == idAction), idAction, objects, texts, level + 1);
		}

		texts.push('');
	}
	else if(object instanceof HIRCEventAction) {
		joinTree(objects.find(o => o.id == object.idObject), object.idObject, objects, texts, level + 1);
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

			joinTree(objectChild, idSound, objects, texts, level + 1);
		}
	}
};



/**
 * @param {import('../bases.js').ExtractConfig} E
 * @param {string} file
 * @param {Set<string>} eventsAll
 */
export default async function parseBNK(E, file, eventsAll) {
	let bifferBNK;
	try {
		bifferBNK = new Biffer(file);

		const GG = G.where(T('parse-bnk:where', { name: parsePath(file).base }));

		/** @type {HIRCObject[]} */
		const objects = [];
		const linesHexDump = [];

		while(!bifferBNK.isEnd()) {
			const [tagSection, sizeSection] = bifferBNK.unpack('4sI');

			// Hierarchy
			if(tagSection == 'HIRC') {
				const bifferSection = bifferBNK.sub(sizeSection);

				const [sizeObject] = bifferSection.unpack('I');

				for(let index = 0; index < sizeObject; index++) {
					const [type, length, id] = bifferSection.unpack('BII');

					GG.traceD(...TS(`parse-bnk:parse-hirc`, { id: showID(id), type, pos: bifferSection.tell() - 10, length }, 'header'));

					const B = bifferSection.sub(length - 4);

					const [objectSection, objectsExtra] = parseHIRCObject(id, type, B, GG);

					if(objectSection) { objects.push(objectSection); }

					objects.push(...objectsExtra);


					const idsHexObjectDump = E.idsHexEventTreeDump ?? [];
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
					throw StackError(TLogError(`parse-bnk:parse-bkhd`, { id: showID(idBank), version }, 'unexpected-version'), GG.where);
				}

				GG.debugD(...TS('parse-bnk:parse-bkhd', { id: showID(idBank), version, idProject: toHexL8(idProject) }, 'header'));
			}
			else {
				bifferBNK.skip(sizeSection);

				GG.warnD(...TS('parse-bnk.what', { tag: tagSection }, 'unhandled-section'));
			}
		}



		if(linesHexDump.length) {
			writeFileSync(
				resolve(E.dirExportDebug, 'hex', `${E.slot}@${E.regionCDN}@${E.lang}@${E.timeExtract.format('HHmmss')}@hex.txt`),
				linesHexDump.join('\n'),
			);
		}


		const events$hash = {};
		const events$idAudio = {};
		const events$hashHex = {};

		for(const event of eventsAll) {
			events$hash[fnv_1(event)] = event;
			events$hashHex[toHexL8(fnv_1(event))] = event;
		}

		if(linesHexDump.length) {
			appendFileSync(
				resolve(E.dirExportDebug, 'hex', `${E.slot}@${E.regionCDN}@${E.lang}@${E.timeExtract.format('HHmmss')}@hex.json`),
				JSON.stringify(events$hashHex, null, '\t') + '\n',
			);
		}

		const objectsEvent = objects.filter(object => object instanceof HIRCEvent);

		for(const objectEvent of objectsEvent) {
			const event = events$hash[objectEvent.id] ?? objectEvent.id;

			if(typeof event != 'string') {
				GG.warnD(...TS('parse-bnk:group-ids', { event }, 'unknown-event-name'));

				objectEvent.event = `unknown-name:${event}`;
			}
			else {
				objectEvent.event = event;
			}



			const idsAudioChild = [];
			for(const actionID of objectEvent.idsAction) {
				/** @type {HIRCEventAction} */
				const action = objects.find(object => object.id == actionID);

				const objectAction = objects.find(object => object.id == action.idObject);

				idsAudioChild.push(...groupActionChildAudioIDs(objectAction, objects, action, GG));
			}


			for(const idAudio of idsAudioChild) {
				(events$idAudio[idAudio] || (events$idAudio[idAudio] = new Set())).add(event);
			}
		}


		const idsSound$idAudio = {};

		for(const sound of objects.filter(object => object instanceof HIRCSound)) {
			(idsSound$idAudio[sound.idAudio] || (idsSound$idAudio[sound.idAudio] = new Set())).add(sound.id);
		}


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


		if(E.dumpEventTree) {
			const textsTree = [];
			for(const object of objects.filter(object => object instanceof HIRCEvent)) {
				joinTree(object, object.id, objects, textsTree);
			}

			if(textsTree.length) {
				const lang = !E.saveWithShort ? E.lang : E.lang.split('_')[0];
				const region = (!E.saveWithShort ? E.regionCDN : E.regionCDN.replace(/\d+$/, '')).toLowerCase();

				writeFileSync(
					resolve(E.dirExportDebug, `event-tree@${parsePath(file).base}@${region}@${lang}@${E.slot}@${E.timeExtract.format('HHmmss')}.txt`),
					textsTree.join('\n')
				);
			}
		}


		return [events$idAudio, idsSound$idAudio];
	}
	finally {
		bifferBNK.close();
	}
}
