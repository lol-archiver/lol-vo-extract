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
	}
}

export class HIRCEvent extends HIRCObject {
	constructor(id, count) {
		super(id, 4);


		this.count = count;
		this.eventActions = null;
	}
}

export class HIRCContainer extends HIRCObject {
	constructor(id) {
		super(id, 5);

		this.idsSound = [];
	}
}

export class HIRCSwitchContainer extends HIRCObject {
	constructor(id) {
		super(id, 6);

		this.idsSound = [];
	}
}
