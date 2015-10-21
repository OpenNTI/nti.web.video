export class WindowMessageListener {

	constructor () {
		this.listers = [];
		this.onMessage = this.onMessage.bind(this);
	}


	onMessage (event) {
		this.listers.forEach(fn => {
			try {
				fn(event);
			} catch (e) {
				console.error(e.stack || e.message || e);
			}
		});
	}


	attach () {
		if (!this.listening) {
			window.addEventListener('message', this.onMessage, false);
			this.listening = true;
		}
	}

	detach () {
		window.removeEventListener('message', this.onMessage, false);
		this.listening = false;
	}

	add (fn) {
		this.listers = this.listers.filter(x=> x !== fn);
		this.listers.push(fn);
		this.attach();
	}


	remove (fn) {
		this.listers = this.listers.filter(x=> x !== fn);
		if (this.listers.length === 0) {
			this.detach();
		}
	}
}

const singleton = new WindowMessageListener();
export default singleton;
