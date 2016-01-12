const ID = Symbol();
export default class Task {
	constructor (fn, interval) {
		this.fn = fn;
		this.interval = interval || 1000;
	}

	start () {
		if (this[ID]) {
			return;
		}
		this[ID] = setInterval(this.fn, this.interval);
	}

	stop () {
		clearInterval(this[ID]);
		delete this[ID];
	}
}
