export default class HIRCAction {
	constructor(id, scope, actionType, HIRCID, paramCount) {
		this.id = id;

		this.scope = scope;
		this.actionType = actionType;
		this.HIRCID = HIRCID;
		this.paramCount = paramCount;

		this.paramTypes = null;
		this.params = null;
	}
}