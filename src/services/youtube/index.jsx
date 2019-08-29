import React from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import Logger from '@nti/util-logger';
import uuid from 'uuid';
import QueryString from 'query-string';

import {EventHandlers} from '../../Constants';
import MESSAGES from '../WindowMessageListener';
import Task from '../Task';
import {resolveCanAccessSource, createNonRecoverableError, parseJSON} from '../utils';

const logger = Logger.get('video:youtube');

const YOU_TUBE = 'https://www.youtube.com';

// const UNSTARTED = -1;
// const ENDED = 0;
const PLAYING = 1;
// const PAUSED = 2;
// const BUFFERING = 3;
// const CUED = 5;

/*
const YOU_TUBE_STATES = {
	[UNSTARTED]: 'UNSTARTED',
	[ENDED]: 'ENDED',
	[PLAYING]: 'PLAYING',
	[PAUSED]: 'PAUSED',
	[BUFFERING]: 'BUFFERING',
	[CUED]: 'CUED'
};
*/

//TODO: To detect an unrecoverable error try pinging the youtube API
//instead of waiting for the to fail. That should catch both cases:
//1) Youtube is blocked
//2) The video doesn't exist


const YT_STATE_TO_EVENTS = {
	0: 'ended',
	1: 'playing',
	2: 'pause'
	//There is no seek event for YT
};


export default class YouTubeVideo extends React.Component {
	static service = 'youtube'

	static getID (url) {
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		if (match && match[2].length === 11) {
			return match[2];
		}
		return null;
	}

	static getCanonicalURL (url, videoId) {
		const id = videoId || this.getID(url);
		return `${YOU_TUBE}/embed/${id}`;
	}

	static propTypes = {
		source: PropTypes.any.isRequired,
		deferred: PropTypes.bool,
		onError: PropTypes.func,
		width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
		height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onRateChange: PropTypes.func,
		onSeeked: PropTypes.func,
		onTimeUpdate: PropTypes.func,
		onReady: PropTypes.func,
	}


	attachRef = (x) => { this.iframe = x; }


	constructor (props) {
		super(props);
		this.state = {
			id: uuid(),
			scope: YOU_TUBE,
			playerState: -1,
			initTask: new Task(this.sendListening, 250)
		};

		this.updateURL(props, x => Object.assign(this.state, x));
	}


	componentDidMount () {
		this.ensureAccess();
		this.updateURL();
		MESSAGES.add(this.onMessage);
	}


	componentWillUnmount () {
		this.state.initTask.stop();
		MESSAGES.remove(this.onMessage);
	}


	componentDidUpdate (prevProps, prevState) {
		const {state} = this;
		const {initTask} = state;
		const prevInitTask = prevState.initTask;

		invariant(
			(initTask && (initTask === prevInitTask || !prevInitTask)),
			'Something changed the initTask!'
		);

		if (prevProps.source !== this.props.source) {
			this.ensureAccess();
			this.updateURL();
			return;
		}

		if (state.initialized && state.playerURL === prevState.playerURL) {
			initTask.stop();
			return;
		}

		initTask.start();

		if (state.autoPlay !== prevState.autoPlay) {
			this.updateURL();
		}
	}


	async ensureAccess (props = this.props) {
		const {source, onError} = props;

		const onNoAccess = () => {
			const error = createNonRecoverableError('Unable to access youtube video');

			if (onError) {
				onError(error);
			}
		};

		try {
			const canAccess = await resolveCanAccessSource(source);

			if (!canAccess) { onNoAccess(); }
		} catch (e) {
			onNoAccess(e);
		}
	}


	getPlayerState () {
		const {playerState, currentTime, duration, playbackRate} = this.state;

		return {
			service: YouTubeVideo.service,
			time: currentTime,
			state: playerState,
			duration,
			speed: playbackRate
		};
	}


	buildURL = (props) => {
		const unwrap = x => Array.isArray(x) ? x[0] : x;
		const {deferred, source: mediaSource} = props;
		const {location} = global;

		const videoId = typeof mediaSource === 'string'
			? YouTubeVideo.getID(mediaSource)
			: unwrap(mediaSource.source);

		const args = {
			enablejsapi: 1,
			html5: 1,
			modestbranding: 1,
			autohide: 1,
			wmode: 'transparent',
			rel: 0,
			showinfo: 0,
			playsinline: 1,
			autoplay: (props.autoPlay || ((this.state || {}).autoPlay && deferred)) ? 1 : 0,
			origin: location.protocol + '//' + location.host
		};

		return `${YOU_TUBE}/embed/${videoId}?${QueryString.stringify(args)}`;
	}


	updateURL = (props = this.props, update = x => this.setState(x)) => {
		update({playerURL: this.buildURL(props)});
	}


	getPlayerContext = () => {
		const {iframe} = this;
		return iframe && (iframe.contentWindow || window.frames[iframe.name]);
	}


	render () {
		const {autoPlay, id} = this.state;
		const {source, deferred, width, height} = this.props;

		if (!id) {
			logger.error('No ID');
			return;
		}

		if (!source) {
			return (<div>No source</div>);
		}

		const render = !deferred || autoPlay;

		return !render ? null : (
			<iframe
				name={id}
				ref={this.attachRef}
				src={this.state.playerURL}
				width={width}
				height={height}
				frameBorder="0"
				allow="autoplay"
				allowFullScreen
			/>
		);
	}


	sendListening = () => {
		if (this.getPlayerContext()) {
			this.postMessage();
		}
	}


	finishInitialization = () => {
		this.setState({initialized: true});
		this.postMessage('addEventListener', ['onReady']);
		this.postMessage('addEventListener', ['onStateChange']);
		this.postMessage('addEventListener', ['onError']);
	}


	onMessage = (event) => {
		const unwrap = x => {
			if (Array.isArray(x)) {
				if (x.length !== 1) {
					logger.warn('Unexpected Data!!', x);
				}
				return x[0];
			}
			return x;
		};
		const getData = x => typeof x === 'string' ? parseJSON(x) : x;
		const data = getData(event.data);
		const eventName = unwrap(data && data.event) || '';
		const handlerName = 'handle' + eventName.charAt(0).toUpperCase() + eventName.substr(1);
		const implemented = !!this[handlerName];

		//event.source === this.getPlayerContext()

		const originMismatch = event.origin !== this.state.scope;
		const idMismatch = (data && data.id) !== this.state.id;

		if (originMismatch || idMismatch) {

			// logger.debug('[YouTube] Ignoring Event (because origin mismatch: %o %o %o, or id mismatch %o, %o) %o',
			// 	originMismatch, event.origin, this.state.scope,
			// 	idMismatch, data.id || data,
			// 	event);
			return;
		}

		if (window.debugYT || !implemented) {
			logger[implemented ? 'debug' : 'warn']('[YouTube] Event: %s %s %o', data.id, data.event, data);
		}

		if (!this.state.initialized) {
			this.finishInitialization();
		}

		if (implemented) {
			this[handlerName](data.info);
		}
	}


	postMessage = (method, ...params) => {
		const context = this.getPlayerContext();
		if (!context) {
			logger.warn(this.state.id, ' No Player Context!');
			return;
		}

		const data = method
			? {
				event: 'command',
				func: method,
				args: params,
				id: this.state.id
			} : {
				event: 'listening',
				id: this.state.id
			};

		if (window.debugYT) {
			logger.debug('[YouTube] Sending: %s %o', method || 'listening', data);
		}
		context.postMessage(JSON.stringify(data), this.state.scope);
	}


	handleInfoDelivery = (info) => {
		const {onRateChange} = this.props;
		const {playbackRate:oldRate = 1} = this.state;

		this.setState(info, () => {
			const {playbackRate:newRate} = this.state;

			if (onRateChange && oldRate !== newRate) {
				onRateChange(oldRate, newRate, {
					timeStamp: Date.now(),
					target: {
						currentTime: info.currentTime || this.state.currentTime,
						duration: info.duration,
						playbackRate: newRate,
					},
					type: 'ratechange'
				});
			}
		});

		if (Object.prototype.hasOwnProperty.call(info,'currentTime')) {
			this.fireEvent('timeupdate');
		}
	}


	handleInitialDelivery = (info) => {
		this.setState(info);

		const {onError} = this.props;
		const {videoData} = info || {};
		const {video_id:videoId} = videoData || {};

		if (!videoId) {
			const error = new Error('Missing Video');

			error.nonRecoverable = true;

			if (onError) {
				onError(error);
			}
		}
	}


	handleApiInfoDelivery = () => {}


	handleOnReady = () => {
		const {onReady} = this.props;

		if (onReady) {
			onReady();
		}
	}//nothing to do


	handleOnStateChange = (state) => {
		if (this.state.playerState !== state) {
			this.setState({playerState: state});
		}

		const event = YT_STATE_TO_EVENTS[state];
		if (event) {
			this.fireEvent(event);
		}
	}


	fireEvent = (event) => {
		if (this.props[EventHandlers[event]]) {

			this.props[EventHandlers[event]]({
				timeStamp: Date.now(),
				target: {
					currentTime: this.state.currentTime,
					duration: this.state.duration,
					playbackRate: this.state.playbackRate,
				},
				type: event
			});
		}
	}


	play = () => {
		if (this.props.deferred) {
			if (!this.state.autoPlay) {
				this.setState({autoPlay: true}, ()=> {
					setTimeout(()=> {
						if (this.state.playerState !== PLAYING) {
							this.fireEvent('playing');//force event, triggers poster to hide.
						}
					}, 1000);
				});

				return;
			}
		}

		this.postMessage('playVideo');
	}


	pause = () => {
		this.postMessage('pauseVideo');
	}


	stop = () => {
		this.postMessage('stopVideo');
	}


	setCurrentTime = (time) => {
		this.postMessage('seekTo', time);
	}
}
