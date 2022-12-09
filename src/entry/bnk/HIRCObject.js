import { showID } from '../../../lib/utility.js';



const textsScopeAction = {
	0x01: 'switch or trigger',
	0x02: 'global',
	0x03: 'game object',
	0x04: 'state',
	0x05: 'all',
	0x09: 'all Except game object',
};

const textsAction = {
	0x01: 'stop',
	0x02: 'pause',
	0x03: 'resume',
	0x04: 'play',
	0x05: 'trigger',
	0x06: 'mute',
	0x07: 'unmute',
	0x08: 'set voice pitch',
	0x09: 'reset voice pitch',
	0x0a: 'set voice volume',
	0x0b: 'reset voice volume',
	0x0c: 'set bus volume',
	0x0d: 'reset bus volume',
	0x0e: 'set voice low-pass filter',
	0x0f: 'reset voice low-pass filter',
	0x10: 'enable state',
	0x11: 'disable state',
	0x12: 'set state',
	0x13: 'set game parameter',
	0x14: 'reset game parameter',
	0x19: 'set switch',
	0x1a: 'enable bypass or disable bypass',
	0x1b: 'reset bypass effect',
	0x1c: 'break',
	0x1e: 'seek',
};

export class HIRCObject {
	/**
	 * @type {number}
	 */
	id;

	/**
	 * @type {number}
	 */
	type;



	constructor(id, type) {
		this.id = id;
		this.type = type;
	}

	toString() { return `${this.__proto__.constructor.name}:${showID(this.id)}`; }
}


export class HIRCSound extends HIRCObject {
	constructor(id, embedType, audioID, sourceID) {
		super(id, 2);


		this.embedType = embedType;
		this.audioID = audioID;
		this.sourceID = sourceID;

		this.fileIndex = null;
		this.fileLength = null;

		this.soundType = null;
	}

	toString() { return `${super.toString()} --> audio:${showID(this.audioID)}`; }
}

export class HIRCEventAction extends HIRCObject {
	constructor(id, scope, actionType, idObject, paramCount) {
		super(id, 3);


		this.scope = scope;
		this.actionType = actionType;
		this.idObject = idObject;
		this.paramCount = paramCount;

		this.paramTypes = null;
		this.params = null;

		this.idGroup = null;
		this.idCondition = null;
	}

	toString() {
		return `${super.toString()} --> scope:${textsScopeAction[this.scope] ?? this.scope} action:${textsAction[this.actionType] ?? this.actionType}`
			+ (this.idGroup ? ` group:${showID(this.idGroup)} cond:${showID(this.idCondition)}` : '');
	}
}

export class HIRCEvent extends HIRCObject {
	constructor(id, count) {
		super(id, 4);


		this.count = count;
		this.idsAction = null;
	}

	toString() { return `${super.toString()} --> name:${this.eventFull}`; }
}

export class HIRCContainer extends HIRCObject {
	constructor(id) {
		super(id, 5);

		this.idsSound = [];
	}

	// toString() { return `${super.toString()} --> sounds:${this.idsSound.map(id => showID(id)).join(',')}`; }
}

export class HIRCSwitchContainer extends HIRCObject {
	constructor(id) {
		super(id, 6);

		this.idsSound = [];
	}

	// toString() { return `${super.toString()} --> sounds:${this.idsSound.map(id => showID(id)).join(',')}`; }
}


export class HIRCSwitch extends HIRCObject {
	constructor(id, idsSound = []) {
		super(id, 1001);

		this.idsSound = idsSound;
	}

	toString() { return `${super.toString()} --> sounds:${this.idsSound.map(id => showID(id)).join(',')}`; }
}
