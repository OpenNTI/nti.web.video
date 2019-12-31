import EventEmitter from 'events';

import {ExternalLibraryManager} from '@nti/web-client';

const WistiaJS = '//fast.wistia.net/assets/external/E-v1.js';

class Players {
	#players = new WeakMap();
	#listeners = new WeakMap();

	async loadScript () {
		if (this.scriptLoaded) { return; }

		this.scriptLoaded = true;

		global._wq = global._wq || [];
		global._wq.push({
			id: '_all',
			onReady: (video) => {
				const {iframe} = video;

				this.#players.set(iframe, video);

				if (this.#listeners.has(iframe)) {
					this.#listeners.get(iframe)(video);
					this.#listeners.delete(iframe);
				}
			}
		});

		try {
			await ExternalLibraryManager.injectScript(WistiaJS, 'Wistia');
		} catch (e) {
			this.scriptLoaded = false;
		}
	}

	getPlayer (iframe) {
		if (this.#players.has(iframe)) { return Promise.resolve(this.#players.get(iframe)); }

		return new Promise((fulfill) => {
			this.#listeners.set(iframe, video => fulfill(video));	

			this.loadScript();
		});


	}


}

const PlayerCache = new Players();

export default class WistiaPlayer extends EventEmitter {
	static getEmbedURL (source) {
		const {source: ids} = source;
		const sourceId = Array.isArray(ids) ? ids[0] : ids;

		return `//fast.wistia.net/embed/iframe/${sourceId}`;
	}

	#player = null;

	constructor (iframe) {
		super();

		this.commandQueue = [];
		this.setupListeners(iframe);

		const echo = (event) => (() => this.emit(event));

		this.playEvent = echo('play');
		this.pauseEvent = echo('pause');
		this.endEvent = echo('end');
		this.timeChangeEvent = echo('timechange');
		this.rateChangeEvent = echo('ratechange');
		this.seekEvent = echo('seek');
	}

	async setupListeners (iframe) {
		const player = await PlayerCache.getPlayer(iframe);

		this.#player = player;

		player.bind('play', this.playEvent);
		player.bind('pause', this.pauseEvent);
		player.bind('end', this.endEvent);
		player.bind('timechange', this.timeChangeEvent);
		player.bind('playbackratechange', this.rateChangeEvent);
		player.bind('seek', this.seekEvent);
	}

	teardown () {
		if (!this.#player) { return; }

		this.#player.unbind('play', this.playEvent);
		this.#player.unbind('pause', this.pauseEvent);
		this.#player.unbind('end', this.endEvent);
		this.#player.unbind('timechange', this.timeChangeEvent);
		this.#player.unbind('playbackratechange', this.rateChangeEvent);
		this.#player.unbind('seek', this.seekEvent);
	}

	play () {
		if (this.#player) {
			this.#player.play();
		} else {
			this.commandQueue.push(() => this.play());
		}
	}

	pause () {
		if (this.#player) {
			this.#player.pause();
		} else {
			this.commandQueue.push(() => this.pause());
		}
	}

	setCurrentTime (time) {
		if (this.#player) {
			this.player.time(time);
		} else {
			this.commandQueue.push(() => this.setCurrentTime(time));
		}
	}
}
