import EventEmitter from 'events';

import React from 'react';

import {Hooks} from '@nti/web-commons';

import {Context} from './Constants';

class ContextObject extends EventEmitter {
	#players = [];

	get activePlayer () { return this.#players[0]; }

	setupPlayerContext (player) {
		//TODO?: handle multiple players at once... If we need to. We might not..
		if (this.#players.length > 0) { throw new Error('Cannot have multiple videos in one context'); }

		this.#players.push(player);
		this.emit('set-player', player);

		return {
			onTimeUpdate (...args) { this.emit('time-update', ...args); },
			onSeeked (...args) { this.emit('seeked', ...args); },
			onPlaying (...args) { this.emit('playing', ...args); },
			onPause (...args) { this.emit('paused', ...args); },
			onEnded (...args) { this.emit('ended', ...args); },
			onError (...args) { this.emit('error', ...args); },
			onReady (...args) { this.emit('ready', ...args); },

			teardown: () => {
				const isActive = this.activePlayer === player;

				this.#players = this.#players.filter(p => p !== player);

				if (isActive) {
					this.emit('set-player', null);
				}
			}
		};
	}

	subscribe (event, fn) {
		this.addListener(event, fn);

		return () => this.removeListener(event, fn);
	}
};

export function VideoContext (props) {
	const context = React.useRef(() => new ContextObject());

	return (
		<Context.Provider value={context} {...props} />
	);
}

const useContext = () => React.useContext(Context);
const useEvent = (event, fn) => {
	const context = useContext();

	React.useEffect(() => (
		context && event && fn ?
			context.subscribe(event, fn) :
			null
	), [context, event, fn]);
};

export const usePlayer = () => {
	const forceUpdate = Hooks.useForceUpdate();
	const context = useContext();

	React.useEffect(() => (
		context ?
			context.subscribe('set-player', forceUpdate) :
			null
	), [context]);

	return context?.activePlayer || null;
};

export const useTimeUpdate = (fn) => useEvent('time-update', fn);
export const useSeekedEvent = (fn) => useEvent('seeked', fn);
export const usePlayingEvent = (fn) => useEvent('playing', fn);
export const usePauseEvent = (fn) => useEvent('paused', fn);
export const useEndedEvent = (fn) => useEvent('ended', fn);
export const useErrorEvent = (fn) => useEvent('error', fn);
export const useReadyEvent = (fn) => useEvent('ready', fn);
