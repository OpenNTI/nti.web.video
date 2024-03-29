/** @typedef {import('@nti/web-video').Component} Video */
/** @typedef {(...x: any[]) => void} Emitter */
/** @typedef {() => void} Invalidator */
/** @typedef {{teardown: Invalidator, onTimeUpdate: Emitter, onSeeked: Emitter, onPlaying: Emitter, onPause: Emitter, onEnded: Emitter, onError: Emitter, onReady: Emitter}} PlayerContext */
/** @typedef {(event: Event) => void} EventHandler */

import EventEmitter from 'events';

import { useContext, useEffect, useState } from 'react';

import { Hooks } from '@nti/web-commons';
import { useForceUpdate } from '@nti/web-core';

import { Context } from './Constants';

const { useResolver } = Hooks;

class ContextObject extends EventEmitter {
	#players = [];

	get activePlayer() {
		return this.#players[0];
	}

	/**
	 * Setup context for a give player
	 *
	 * @param {Video} player
	 * @returns {PlayerContext}
	 */
	setupPlayerContext(player) {
		//TODO? handle multiple players at once... If we need to. We might not..
		if (this.#players.length > 0) {
			throw new Error('Cannot have multiple videos in one context');
		}

		this.#players.push(player);
		this.emit('set-player', player);

		return {
			onTimeUpdate: this.emit.bind(this, 'time-update'),
			onSeeked: this.emit.bind(this, 'seeked'),
			onPlaying: this.emit.bind(this, 'playing'),
			onPause: this.emit.bind(this, 'paused'),
			onEnded: this.emit.bind(this, 'ended'),
			onError: this.emit.bind(this, 'error'),
			onReady: this.emit.bind(this, 'ready'),

			teardown: () => {
				const isActive = this.activePlayer === player;

				this.#players = this.#players.filter(p => p !== player);

				if (isActive) {
					this.emit('set-player', null);
				}
			},
		};
	}

	/**
	 * Add a listener to the player context
	 *
	 * @param {string} event what to listen for
	 * @param {EventHandler} fn callback when event is fired
	 * @returns {Invalidator} method to remove the listener
	 */
	subscribe(event, fn) {
		this.addListener(event, fn);

		return () => this.removeListener(event, fn);
	}
}

export function VideoContext(props) {
	const [context] = useState(() => new ContextObject());

	return <Context.Provider value={context} {...props} />;
}

const useEvent = (event, fn) => {
	const context = useContext(Context);

	useEffect(
		() => (context && event && fn ? context.subscribe(event, fn) : null),
		[context, event, fn]
	);
};

/**
 * Use the active player in the current context
 *
 * @returns {Video}
 */
export const usePlayer = () => {
	const forceUpdate = useForceUpdate();
	const context = useContext(Context);

	useEffect(() => {
		if (!context) {
			return null;
		}
		if (context.activePlayer) {
			forceUpdate();
		}

		return context.subscribe('set-player', forceUpdate);
	}, [context]);

	return context?.activePlayer || null;
};

export const useDuration = () => {
	const player = usePlayer();

	const resolver = useResolver(() => {
		return player?.video.getDuration();
	}, [player?.video]);

	return useResolver.isResolved(resolver) ? resolver : null;
};

/**
 * Listen for timeupdate events on the active player in the current context
 *
 * @param {EventHandler} fn
 * @returns {void}
 */
export const useTimeUpdate = fn => useEvent('time-update', fn);

/**
 * Use the current time of the active player in the current context
 *
 * @returns {number}
 */
export const useCurrentTime = () => {
	const forceUpdate = useForceUpdate();
	const player = usePlayer();

	useTimeUpdate(forceUpdate);

	return player?.getPlayerState?.().time ?? 0;
};

/**
 * Listen for seeked events on the active player in the current context
 *
 * @param {EventHandler} fn
 * @returns {void}
 */
export const useSeekedEvent = fn => useEvent('seeked', fn);

/**
 * Listen for play events on the active player in the current context
 *
 * @param {EventHandler} fn
 * @returns {void}
 */
export const usePlayingEvent = fn => useEvent('playing', fn);

/**
 * Listen for pause events on the active player in the current context
 *
 * @param {EventHandler} fn
 * @returns {void}
 */
export const usePauseEvent = fn => useEvent('paused', fn);

/**
 * Listen for end events on the active player in the current context
 *
 * @param {EventHandler} fn
 * @returns {void}
 */
export const useEndedEvent = fn => useEvent('ended', fn);

/**
 * Listen for error events on the active player in the current context
 *
 * @param {EventHandler} fn
 * @returns {void}
 */
export const useErrorEvent = fn => useEvent('error', fn);

/**
 * Listen for ready events on the active player in the current context
 *
 * @param {EventHandler} fn
 * @returns {void}
 */
export const useReadyEvent = fn => useEvent('ready', fn);
