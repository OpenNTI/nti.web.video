import EventEmitter from 'events';

import {ExternalLibraryManager} from '@nti/web-client';

const WistiaJS = '//fast.wistia.net/assets/external/E-v1.js';

//Docs: https://wistia.com/support/developers/player-api

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
	static getEmbedURL (source, options) {
		if (typeof source === 'string') { return source; }

		const {source: ids} = source;
		const sourceId = Array.isArray(ids) ? ids[0] : ids;

		let url = new URL(`https://fast.wistia.net/embed/iframe/${sourceId}`);

		if (options.autoPlay) {
			url.searchParams.set('autoPlay', 'true');
		}

		return url.toString();
	}

	#player = null;

	constructor (iframe) {
		super();

		this.commandQueue = [];
		this.setupListeners(iframe);
		this.playbackRate = 1;

		const echo = (event) => (() => this.emit(event));

		this.playEvent = echo('play');
		this.pauseEvent = echo('pause');
		this.endEvent = echo('end');
		this.timeChangeEvent = echo('timechange');
		this.seekEvent = echo('seek');
		this.rateChangeEvent = (playbackRate) => {
			this.emit('ratechange', {oldRate: this.playbackRate, newRate: playbackRate});
			this.playbackRate = playbackRate;
		};
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
			this.#player.time(time);
		} else {
			this.commandQueue.push(() => this.setCurrentTime(time));
		}
	}


	getPlayerState () {
		if (!this.#player) { return null; }

		return {
			time: this.#player.time(),
			duration: this.#player.duration(),
			speed: this.playbackRate
		};
	}
}
