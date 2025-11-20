import { showID } from '../../../lib/utility.js';



const textsScopeAction = {
	0x01: 'trigger',
	0x02: 'global',
	0x03: 'object',
	0x04: 'state',
	0x05: 'all',
	0x09: 'all(except object)',
};

const textsAction = {
	0x01: 'stop',
	0x02: 'pause',
	0x03: 'resume',
	0x04: 'play',
	0x05: 'play-and-continue',
	0x06: 'mute',
	0x07: 'unmute',
	0x08: 'set-voice-pitch',
	0x09: 'reset-voice-pitch',
	0x0a: 'set-voice-volume',
	0x0b: 'reset-voice-volume',
	0x0c: 'set-bus-volume',
	0x0d: 'reset-bus-volume',
	0x0e: 'set-voice-low-pass-filter',
	0x0f: 'reset-voice-low-pass-filter',
	0x10: 'enable-state',
	0x11: 'disable-state',
	0x12: 'set-state',
	0x13: 'set-game-parameter',
	0x14: 'reset-game-parameter',
	0x19: 'set-switch',
	0x1a: 'switch-bypass-effect',
	0x1b: 'reset-bypass-effect',
	0x1c: 'break',
	0x1d: 'trigger',
	0x1e: 'seek',
	0x1f: 'release',
	0x20: 'set-voice-high-pass-filter',
	0x21: 'play-event',
	0x22: 'reset-play-list',
	0x23: 'play-event-unknown',
	0x30: 'reset-voice-high-pass-filter',
	0x31: 'set-effect',
	0x32: 'reset-effect',
	0x33: 'bypass-effect',
	0x34: 'bypass-effect',
	0x35: 'bypass-effect',
	0x36: 'bypass-effect',
	0x37: 'bypass-effect',
};

export class HIRCObject {
	/** @type {number} */
	id;

	/** @type {number} */
	type;
	/** @type {string} */
	typeName = Object.getPrototypeOf(this).constructor.name;


	/**
	 * @param {number} id
	 * @param {number} type
	 */
	constructor(id, type) {
		this.id = id;
		this.type = type;
	}

	toString() { return `${(this.typeName).replace('HIRC', '')}[${showID(this.id)}]`; }
}


export class HIRCSound extends HIRCObject {
	/** @type {number} */
	idAudio;

	constructor(id, idAudio) {
		super(id, 2);

		this.idAudio = idAudio;
	}

	toString() { return `${super.toString()} --> audio[${showID(this.idAudio)}]`; }
}

export class HIRCAction extends HIRCObject {
	/** @type {number} */
	scope;

	/** @type {number} */
	typeAction;

	/** @type {number} */
	idTarget;

	/** @type {{ type: number, value: number }[]} */
	props = [];
	/** @type {{ type: number, value: number }[]} */
	propsRanged = [];


	/**
	 * Bank ID on Play Action
	 * @type {number}
	 */
	idBank;
	/**
	 * Bank type on Play Action
	 * @type {number}
	 */
	typeBank;
	/**
	 * Group ID on SetState/SetSwitch Action
	 * @type {number}
	 */
	idGroup;
	/**
	 * State ID on SetState/SetSwitch Action
	 * @type {number}
	 */
	idState;


	/**
	 * @param {number} id
	 * @param {number} scope
	 * @param {number} typeAction
	 * @param {number} idTarget
	 */
	constructor(id, scope, typeAction, idTarget) {
		super(id, 3);

		this.scope = scope;
		this.typeAction = typeAction;
		this.idTarget = idTarget;

		this.idGroup = null;
		this.idState = null;
	}

	toString() {
		return `${super.toString()} --> ${textsAction[this.typeAction] ?? this.typeAction} ${textsScopeAction[this.scope] ?? this.scope}`
			+ (this.idGroup ? ` | group[${showID(this.idGroup)}] state[${showID(this.idState)}]` : '');
	}
}

export class HIRCEvent extends HIRCObject {
	/**
	 * literal event name
	 * @type {string}
	 */
	name;

	/** @type {number[]} */
	idsAction = [];


	/** @param {number} id */
	constructor(id) {
		super(id, 4);

		this.name = String(id);
	}

	toString() { return `${super.toString()} --> ${this.name}`; }
}


export class HIRCContainer extends HIRCObject {
	/** @type {number[]} */
	idsChildren = [];

	/** @type {{ type: number, value: number }[]} */
	props = [];
	/** @type {{ type: number, value: number }[]} */
	propsRanged = [];

	constructor(id, type) { super(id, type); }
}

export class HIRCPlayContainer extends HIRCContainer {
	/** @type {number[]} */
	idsSound = [];
	/** @type {number[]} */
	weightsSound = [];

	/** @type {number} */
	mode;


	constructor(id) {
		super(id, 5);
	}

	toString() {
		this.typeName = this.mode == 0 ? 'Random' : 'Sequence';

		return `${super.toString()}${this.idsChildren.length ? ` ${this.idsChildren.length}` : ''}`;
	}
}
export class HIRCSwitchContainer extends HIRCContainer {
	/** @type {HIRCSwitch[]} */
	switches = [];

	/** @type {number} */
	typeGroup;
	/** @type {number} */
	idGroup;
	/** @type {number} */
	idSwitchDefault;


	constructor(id) {
		super(id, 6);

		this.typeName = 'Switches';
	}

	toString() {
		const string = `${super.toString()}${this.idsChildren.length ? ` ${this.idsChildren.length}` : ''}`;

		return `${string} --> group-${this.typeGroup == 0 ? 'switch' : 'state'}[${showID(this.idGroup)}] default[${showID(this.idSwitchDefault)}]`;
	}
}
export class HIRCLayerContainer extends HIRCContainer {
	constructor(id) {
		super(id, 9);

		this.typeName = 'Layer';
	}

	toString() {
		return `${super.toString()}${this.idsChildren.length ? ` ${this.idsChildren.length}` : ''}`;
	}
}


export class HIRCSwitch extends HIRCObject {
	/** @type {number[]} */
	idsChildren = [];


	constructor(id, idsChildren = []) {
		super(id, 1001);

		this.idsChildren.push(...idsChildren);
	}

	toString() { return `${super.toString()} --> sounds${this.idsChildren.map(id => `[${showID(id)}]`).join(',')}`; }
}
