import { G } from '@nuogz/pangu';

import { parse as parsePath } from 'node:path';

import Biffer from '@danor-lib/biffer';

import { T, TS } from '../lib/i18n.js';
import { toHexL8, showID, TLogError, StackError } from '../lib/utility.js';

import { HIRCSound, HIRCAction, HIRCEvent, HIRCObject, HIRCSwitch, HIRCPlayContainer, HIRCSwitchContainer, HIRCLayerContainer } from './entry/bnk/HIRCObject.js';



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

/** @param {Biffer} B */
const unpackUnionNumber = B => {
	let [value] = B.unpack('I');
	if(value > 0x10000000) {
		B.skip(-4);

		[value] = B.unpack('f');
	}

	return value;
};

/** @param {Biffer} B */
const unpackProps = B => {
	const params = [];

	const sizeProps = B.unpack('B');
	for(let i = 0; i < sizeProps; i++) {
		const [type] = B.unpack('B');

		params.push({ type });
	}
	for(let i = 0; i < sizeProps; i++) {
		params[i].value = unpackUnionNumber(B);
	}

	return params;
};

/** @param {Biffer} B */
const unpackPropsRanged = B => {
	const params = [];

	const sizeProps = B.unpack('B');
	for(let i = 0; i < sizeProps; i++) {
		const [type] = B.unpack('B');

		params.push({ type });
	}
	for(let i = 0; i < sizeProps; i++) {
		params[i].min = unpackUnionNumber(B);
		params[i].max = unpackUnionNumber(B);
	}

	return params;
};


/** @param {Biffer} B */
const unapckPlayActionParams = (B, version) => {
	const [/* bitsVector */, idBank] = B.unpack('BI');

	if(version >= 144) {
		const [typeBank] = B.unpack('I');
		return { idBank, typeBank };
	}
	else {
		return { idBank };
	}
};
/** @param {Biffer} B */
const unapckSetStateActionParams = B => {
	const [idGroup, idState] = B.unpack('II');

	return { idGroup, idState };
};
/** @param {Biffer} B */
const unapckSetSwitchActionParams = B => {
	const [idGroup, idState] = B.unpack('II');

	return { idGroup, idState };
};


const unapckersAction$typeBaseAction = {
	Stop: null, // Active + Stop.Specific
	Pause: null, // Active + Pause.Specific
	Resume: null, // Active + Resume.Specific
	Play: unapckPlayActionParams, // Play
	PlayAndContinue: unapckPlayActionParams, // Play
	Mute: null, // SetValue
	SetAkProp: null, // SetValue + SetAkProp.Specific
	UseState: null, // Action
	SetState: unapckSetStateActionParams, // SetState
	SetGameParameter: null, // SetValue + SetGameParameter.Specific
	Event: null, // Action
	Duck: null, // Action
	SetSwitch: unapckSetSwitchActionParams, // SetSwitch
	SetFX: null, // SetFX
	BypassFX: null, // BypassFX
	Break: null, // Action
	Trigger: null, // Action
	Seek: null, // Seek
	Release: null, // Release
	PlayEvent: null, // PlayEvent
	ResetPlaylist: null, // Active + ResetPlaylist.Specific
	PlayEventUnknown: unapckPlayActionParams, // Play
};
const unapckersAction$typeAction = {
	0x01: unapckersAction$typeBaseAction.Stop,
	0x02: unapckersAction$typeBaseAction.Pause,
	0x03: unapckersAction$typeBaseAction.Resume,
	0x04: unapckersAction$typeBaseAction.Play,
	0x05: unapckersAction$typeBaseAction.PlayAndContinue,
	0x06: unapckersAction$typeBaseAction.Mute,
	0x07: unapckersAction$typeBaseAction.Mute,
	0x08: unapckersAction$typeBaseAction.SetAkProp,
	0x09: unapckersAction$typeBaseAction.SetAkProp,
	0x0A: unapckersAction$typeBaseAction.SetAkProp,
	0x0B: unapckersAction$typeBaseAction.SetAkProp,
	0x0C: unapckersAction$typeBaseAction.SetAkProp,
	0x0D: unapckersAction$typeBaseAction.SetAkProp,
	0x0E: unapckersAction$typeBaseAction.SetAkProp,
	0x0F: unapckersAction$typeBaseAction.SetAkProp,
	0x10: unapckersAction$typeBaseAction.UseState,
	0x11: unapckersAction$typeBaseAction.UseState,
	0x12: unapckersAction$typeBaseAction.SetState,
	0x13: unapckersAction$typeBaseAction.SetGameParameter,
	0x14: unapckersAction$typeBaseAction.SetGameParameter,
	0x15: unapckersAction$typeBaseAction.Event,
	0x16: unapckersAction$typeBaseAction.Event,
	0x17: unapckersAction$typeBaseAction.Event,
	0x19: unapckersAction$typeBaseAction.SetSwitch,
	0x1A: unapckersAction$typeBaseAction.BypassFX,
	0x1B: unapckersAction$typeBaseAction.BypassFX,
	0x1C: unapckersAction$typeBaseAction.Break,
	0x1D: unapckersAction$typeBaseAction.Trigger,
	0x1E: unapckersAction$typeBaseAction.Seek,
	0x1F: unapckersAction$typeBaseAction.Release,
	0x20: unapckersAction$typeBaseAction.SetAkProp,
	0x21: unapckersAction$typeBaseAction.PlayEvent,
	0x22: unapckersAction$typeBaseAction.ResetPlaylist,
	0x23: unapckersAction$typeBaseAction.PlayEventUnknown,
	0x30: unapckersAction$typeBaseAction.SetAkProp,
	0x31: unapckersAction$typeBaseAction.SetFX,
	0x32: unapckersAction$typeBaseAction.SetFX,
	0x33: unapckersAction$typeBaseAction.BypassFX,
	0x34: unapckersAction$typeBaseAction.BypassFX,
	0x35: unapckersAction$typeBaseAction.BypassFX,
	0x36: unapckersAction$typeBaseAction.BypassFX,
	0x37: unapckersAction$typeBaseAction.BypassFX,
};



/**
 * @param {number} idSection
 * @param {Biffer} B
 * @param {import('../bases.js').Zagreus} GGG
 */
const parseHIRCSound = (idSection, B, GGG) => {
	const [
		typePlugin,
		typeStream,
		idSource,
	] = B.unpack('HxxBI');


	if(typeStream != 0 && typeStream != 2) { GGG.warnD(`! A ~[HIRCSound] not in bank and not streaming. Check it!`); }
	if(typePlugin == 2) { GGG.warnD(`! A ~[HIRCSound] use source plguin. It may include params. Check it!`); }


	return new HIRCSound(idSection, idSource);
};
/**
 * @param {number} idSection
 * @param {number} version
 * @param {number[]} idsBank
 * @param {Biffer} B
 * @param {import('../bases.js').Zagreus} GGG
 */
const parseHIRCAction = (idSection, version, idsBank, B, GGG) => {
	const [
		scope,
		typeAction,
		idTarget
	] = B.unpack('BBIx');

	const action = new HIRCAction(idSection, scope, typeAction, idTarget);


	action.props.push(...unpackProps(B));
	action.propsRanged.push(...unpackPropsRanged(B));

	const paramsAction = unapckersAction$typeAction[typeAction]?.(B, version);
	Object.assign(action, paramsAction ?? {});


	if(action.idBank && !idsBank.includes(action.idBank)) { GGG.warnD(`! Found an unknown ~[Bank]~{${showID(action.idBank)}}!`); }


	return action;
};
/**
 * @param {number} idSection
 * @param {Biffer} B
 * @param {import('../bases.js').Zagreus} GGG
 */
const parseHIRCEvent = (idSection, B, GGG) => {
	const [count] = B.unpack('B');

	const event = new HIRCEvent(idSection);

	event.idsAction.push(...B.unpack(`${count}I`));


	return event;
};


/**
 * @param {HIRCPlayContainer|HIRCSwitchContainer|HIRCLayerContainer} container
 * @param {number} version
 * @param {Biffer} B
 */
const parseHIRCContainerHeader = (container, version, B) => {
	const [sizeEffects] = B.unpack('xB');

	if(sizeEffects) {
		B.unpack('x');

		for(let indexEffect = 0; indexEffect < sizeEffects; indexEffect++) { B.unpack('x4xxx'); }
	}

	if(version > 136) {
		const [sizeEffectChunk] = B.unpack('xB');

		if(sizeEffectChunk) {
			for(let indexEffect = 0; indexEffect < sizeEffectChunk; indexEffect++) { B.unpack('x4xx'); }
		}
	}

	B.unpack('x4x4xx');


	container.props.push(...unpackProps(B));
	container.propsRanged.push(...unpackPropsRanged(B));


	const [positioning] = B.unpack('B');
	const hasPositioning = (positioning >> 0) & 1;
	const has3D = (positioning >> 1) & 1;

	if(hasPositioning && has3D) {
		B.unpack('x');

		const type3DPosition = (positioning >> 5) & 3;
		const hasAutomation = type3DPosition != 0;

		if(hasAutomation) {
			B.unpack('x4x');

			const [sizeVertices] = B.unpack('I');
			for(let index = 0; index < sizeVertices; index++) { B.unpack('4x4x4x4x'); }

			const [sizeItemsPlayList] = B.unpack('I');
			for(let index = 0; index < sizeItemsPlayList; index++) { B.unpack('4x4x'); }

			for(let index = 0; index < sizeItemsPlayList; index++) { B.unpack('4x4x'); }
		}
	}


	const [bitsAux] = B.unpack('B');

	const hasAux = (bitsAux >> 3) & 1;
	if(hasAux) { B.unpack('4x4x4x4x'); }

	if(version > 135) { B.unpack('4x'); }


	B.unpack('xx2xxx');


	const [sizePropsState] = B.unpack('B');
	if(sizePropsState) {
		for(let indexPropState = 0; indexPropState < sizePropsState; indexPropState++) {
			unpackVariableNumber(B);

			B.unpack('xx');
		}
	}

	const [sizeChunksState] = B.unpack('B');
	if(sizeChunksState) {
		for(let indexChunkState = 0; indexChunkState < sizeChunksState; indexChunkState++) {
			B.unpack('4xx');

			const sizeStates = unpackVariableNumber(B);
			for(let indexState = 0; indexState < sizeStates; indexState++) {
				B.unpack('4x4x');
			}
		}
	}

	const [sizeRTPCOrCurves] = B.unpack('H');
	if(sizeRTPCOrCurves) {
		for(let index = 0; index < sizeRTPCOrCurves; index++) {
			B.unpack('4xxx');

			unpackVariableNumber(B);

			const [sizeGraphPoint] = B.unpack('4xxH');
			for(let indexGraphPoint = 0; indexGraphPoint < sizeGraphPoint; indexGraphPoint++) {
				B.unpack('4x4x4x');
			}
		}
	}
};
/**
 * @param {number} idSection
 * @param {number} version
 * @param {Biffer} B
 * @param {import('../bases.js').Zagreus} GGG
 */
const parseHIRCPlayContainer = (idSection, version, B, GGG) => {
	const container = new HIRCPlayContainer(idSection);


	parseHIRCContainerHeader(container, version, B);


	[container.mode] = B.unpack('2x2x2x4x4x4x2xxxBx');


	const [sizeChildren] = B.unpack('I');
	container.idsChildren = B.unpack(`${sizeChildren}I`);


	const [sizeSound] = B.unpack('H');
	for(let index = 0; index < sizeSound; index++) {
		container.idsSound.push(B.unpack(`I`)[0]);
		container.weightsSound.push(B.unpack(`I`)[0]);
	}

	return container;
};
/**
 * @param {number} idSection
 * @param {number} version
 * @param {HIRCObject[]} objectsExtra
 * @param {Biffer} B
 * @param {import('../bases.js').Zagreus} GGG
 */
const parseHIRCSwitchContainer = (idSection, version, objectsExtra, B, GGG) => {
	const container = new HIRCSwitchContainer(idSection);

	parseHIRCContainerHeader(container, version, B);


	[
		container.typeGroup,
		container.idGroup,
		container.idSwitchDefault,
	] = B.unpack('BIIx');


	const [sizeChildren] = B.unpack('I');
	container.idsChildren = B.unpack(`${sizeChildren}I`);


	const [sizeSwitches] = B.unpack('I');
	for(let index = 0; index < sizeSwitches; index++) {
		const [id, sizeSwitch] = B.unpack(`II`);

		const sw = new HIRCSwitch(id, B.unpack(`${sizeSwitch}I`));

		container.switches.push(sw);
		objectsExtra.push(sw);
	}

	return container;
};
/**
 * @param {number} idSection
 * @param {Biffer} B
 * @param {import('../bases.js').Zagreus} GGG
 */
const parseHIRCLayerContainer = (idSection, version, B, GGG) => {
	const container = new HIRCLayerContainer(idSection);

	parseHIRCContainerHeader(container, version, B);


	const [sizeChildren] = B.unpack('I');
	container.idsChildren = B.unpack(`${sizeChildren}I`);


	const [sizeLayers] = B.unpack('I');
	if(sizeLayers) { GGG.warnD('! Found a ~[Layer]. Check it!'); }

	return container;
};



// 0x01(01): State
// 0x07(07): Actor Mixer
// 0x0E(14): Attenuation
// 0x10(16): Fx Share Set
// 0x11(17): Fx Custom
const typesObjectHIRCSkip = [1, 7, 14, 16, 17];

/**
 * @param {number} idSection
 * @param {number} typeSection
 * @param {number} version
 * @param {number[]} idsBank
 * @param {Biffer} B
 * @param {import('../bases.js').Melinoe} GG
 */
export const parseHIRCObject = (idSection, typeSection, version, idsBank, B, GG) => {
	const GGG = GG.what(...TS(`parse-bnk:parse-hirc`, { id: showID(idSection) }));


	let object;
	const objectsExtra = [];
	if(typeSection == 2) {
		object = parseHIRCSound(idSection, B, GGG);
	}
	else if(typeSection == 3) {
		object = parseHIRCAction(idSection, version, idsBank, B, GGG);
	}
	else if(typeSection == 4) {
		object = parseHIRCEvent(idSection, B, GGG);
	}
	else if(typeSection == 5) {
		object = parseHIRCPlayContainer(idSection, version, B, GGG);
	}
	else if(typeSection == 6) {
		object = parseHIRCSwitchContainer(idSection, version, objectsExtra, B, GGG);
	}
	else if(typeSection == 9) {
		object = parseHIRCLayerContainer(idSection, version, B, GGG);
	}
	else if(!typesObjectHIRCSkip.includes(typeSection)) {
		GG.warnD(...TS(`parse-bnk:parse-hirc`, { id: showID(idSection), type: typeSection }, 'unparsed-type'));

		object = new HIRCObject(idSection, typeSection);
	}


	return [object, objectsExtra];
};






const versionsSupport = [134, 145];

/**
 * @param {import('../bases.js').ExtractConfig} E
 * @param {string} file
 * @param {Set<string>} literalsEvent
 */
export default async function parseBNK(E, file, literalsEvent) {
	let bifferBNK;
	try {
		bifferBNK = new Biffer(file);

		const GG = G.where(T('parse-bnk:where', { name: parsePath(file).base }));

		/** @type {HIRCObject[]} */
		const objects = [];
		/** @type {number[]} */
		const idsBank = [];

		/** @type {number} */
		let versionBank;

		while(!bifferBNK.isReach()) {
			const [tagSection, sizeSection] = bifferBNK.unpack('4sI');

			// Hierarchy
			if(tagSection == 'HIRC') {
				const bifferSection = bifferBNK.slice(sizeSection);

				const [sizeObject] = bifferSection.unpack('I');

				for(let index = 0; index < sizeObject; index++) {
					const [type, length, id] = bifferSection.unpack('BII');

					GG.traceD(...TS(`parse-bnk:parse-hirc`, { id: showID(id), type, pos: bifferSection.tell() - 10, length }, 'header'));

					const B = bifferSection.slice(length - 4);

					const [objectSection, objectsExtra] = parseHIRCObject(id, type, versionBank, idsBank, B, GG);

					if(objectSection) { objects.push(objectSection); }

					objects.push(...objectsExtra);
				}
			}
			// Bank Header
			else if(tagSection == 'BKHD') {
				const [
					version,
					idBank,
					idProject
				] = bifferBNK.unpack('II4x4xI');

				idsBank.push(idBank);
				versionBank = version;

				if(version > 141) { bifferBNK.unpack('4x8x8x'); }

				const gap = version <= 141 ? sizeSection - Biffer.calc('5L') :
					sizeSection - Biffer.calc('5L') - Biffer.calc('L') - Biffer.calc('4L');
				if(gap > 0) { bifferBNK.skip(gap); }

				if(!versionsSupport.includes(version)) {
					throw StackError(TLogError(`parse-bnk:parse-bkhd`, { id: showID(idBank), version }, 'unexpected-version'), GG.where);
				}


				GG.debugD(...TS('parse-bnk:parse-bkhd', { id: showID(idBank), version, idProject: toHexL8(idProject) }, 'header'));
			}
			else {
				bifferBNK.skip(sizeSection);

				if(!['DIDX', 'DATA'].includes(tagSection)) {
					GG.warnD(...TS('parse-bnk.what', { tag: tagSection }, 'unhandled-section'));
				}
			}
		}

		/** @type {Object<string, string>} */
		const literalsEvent$hash = {};
		for(const literalEvent of literalsEvent) {
			literalsEvent$hash[fnv_1(literalEvent)] = literalEvent;
		}


		for(const event of objects.filter(object => object instanceof HIRCEvent)) {
			const literalEvent = literalsEvent$hash[event.id] ?? event.id;

			if(typeof literalEvent != 'string') {
				GG.warnD(...TS('parse-bnk:group-ids', { event: literalEvent }, 'unknown-event-name'));

				event.name = `unknown-${literalEvent}`;
			}
			else {
				event.name = literalEvent;
			}
		}

		return objects;
	}
	finally {
		bifferBNK.close();
	}
}
