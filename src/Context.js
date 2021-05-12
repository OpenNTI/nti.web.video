import EventEmitter from 'events';

import React from 'react';

import {Hooks} from '@nti/web-commons';

import {SetupPlayerContext, TeardownPlayerContext} from './Constants';

const Context = React.createContext();

class ContextObject extends EventEmitter {
	#player = null;

	get player () { return this.#player; }

	[SetupPlayerContext] (player) {
		if (this.#player) { throw new Error('Cannot have multiple videos in one context'); }

		this.#player = player;
		this.emit('set-player', player);

		return {
			onTimeUpdate (...args) { this.emit('time-update', ...args); },
			onSeeked (...args) { this.emit('seeked', ...args); },
			onPlaying (...args) { this.emit('playing', ...args); },
			onPause (...args) { this.emit('paused', ...args); },
			onEnded (...args) { this.emit('ended', ...args); },
			onError (...args) { this.emit('error', ...args); },
			onReady (...args) { this.emit('ready', ...args); }
		};
	}

	[TeardownPlayerContext] (player) {
		if (this.#player === player) {
			this.#player = null;
			this.emit('set-player', player);
		}
	}

	subscribe (event, fn) {
		this.addListener(event, fn);

		return () => this.removeListener(event, fn);
	}
};

export function VideoContext (props) {
	const context = React.useRef(() => new ContextObject());

	return (
		<Context.Provider value={context} />
	);
}

export const useContext = () => React.useContext(Context);
export const usePlayer = () => {
	const forceUpdate = Hooks.useForceUpdate();
	const context = VideoContext.useContext();

	React.useEffect(() => (
		context ?
			context.subscribe('set-player', forceUpdate) :
			null
	), [context]);

	return context?.player || null;
};

const useEvent = (event, fn) => {
	const context = VideoContext.useContext();

	React.useEffect(() => (
		context && event && fn ?
			context.subscribe(event, fn) :
			null
	), [context, event, fn]);
};

export const useTimeUpdate = (fn) => useEvent('time-update', fn);
export const useSeekedEvent = (fn) => useEvent('seeked', fn);
export const usePlayingEvent = (fn) => useEvent('playing', fn);
export const usePauseEvent = (fn) => useEvent('paused', fn);
export const useEndedEvent = (fn) => useEvent('ended', fn);
export const useErrorEvent = (fn) => useEvent('error', fn);
export const useReadyEvent = (fn) => useEvent('ready', fn);
