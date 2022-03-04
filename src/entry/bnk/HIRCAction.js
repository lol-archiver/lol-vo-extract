export default class HircAction {
	constructor(id, scope, actionType, hircID, paramCount) {
		this.id = id;

		this.scope = scope;
		this.actionType = actionType;
		this.hircID = hircID;
		this.paramCount = paramCount;

		this.paramTypes = null;
		this.params = null;
	}
}