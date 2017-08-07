import QueryString from 'querystring';

import React from 'react';
import PropTypes from 'prop-types';
import Logger from 'nti-util-logger';
import uuid from 'uuid';

import {
	EventHandlers,
	UNSTARTED,
	ENDED,
	PLAYING,
	PAUSED
} from '../../Constants';
import MESSAGES from '../WindowMessageListener';
import {resolveCanAccessSource, createNonRecoverableError} from '../utils';


const logger = Logger.get('video:vimeo');

const VIMEO_EVENTS_TO_HTML5 = {
	play: 'playing',
	pause: 'pause',
	finish: 'ended',
	seek: 'seeked',
	playProgress: 'timeupdate'
};

const VIMEO_URL_PARTS = /(?:https?:)?\/\/(?:(?:www|player)\.)?vimeo.com\/(?:(?:channels|video)\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?|#)/i;
const VIMEO_PROTOCOL_PARTS = /vimeo:\/\/(\d+\/)?(\d+)/i;

//TODO: To detect an unrecoverable error try pinging the Vimeo API
//instead of waiting for the to fail. That should catch both cases:
//1) Vimeo is blocked
//2) The video doesn't exist

export default class VimeoVideo extends React.Component {
	static service = 'vimeo';

	static getID (url) {
		/** @see test */

		const getFromCustomProtocol = x => x.match(VIMEO_PROTOCOL_PARTS);
		const getFromURL = x => x.match(VIMEO_URL_PARTS);

		const [/*matchedURL*/, /*albumId*/, id] = getFromCustomProtocol(url) || getFromURL(url) || [];
		return id || null;
	}

	static async resolveID (url) {
		const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
		const response = await fetch(endpoint);

		if (!response.ok) {
			throw new Error(`Invalid: ${response.statusCode}: ${response.statusText}`);
		}

		const data = await response.json();
		return data.video_id;
	}

	static getCanonicalURL (url, videoId) {
		const id = videoId || this.getID(url);
		return `https://www.vimeo.com/${id}`;
	}

	static propTypes = {
		source: PropTypes.any.isRequired,
		autoPlay: PropTypes.bool
	}

	state = {}


	attachRef = (x) => { this.iframe = x; };


	componentWillMount () {
		const id = uuid();
		this.setState({id});
		this.updateURL(this.props, id);
	}


	componentDidMount () {
		this.ensureAccess(this.props);
		MESSAGES.add(this.onMessage);
	}


	componentWillReceiveProps (nextProps) {
		this.ensureAccess(nextProps);
		this.updateURL(nextProps);
	}


	componentWillUnmount () {
		MESSAGES.remove(this.onMessage);
	}


	async ensureAccess (props = this.props) {
		const {source, onError} = props;

		const onNoAccess = () => {
			const error = createNonRecoverableError('Unable to access vimeo video');

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


	buildURL = (props, id = this.state.id) => {
		const {source: mediaSource, autoPlay} = props;

		let videoId = typeof mediaSource === 'string' ? Source.getID(mediaSource) : mediaSource.source;

		if (Array.isArray(videoId)) {
			videoId = videoId[0];
		}

		if (!id) {
			logger.error('Player ID missing');
		}

		const args = {
			api: 1,
			player_id: id,//eslint-disable-line camelcase
			//autopause: 0, //we handle this for other videos, but its nice we only have to do this for cross-provider videos.
			autoplay: autoPlay ? 1 : 0,
			badge: 0,
			byline: 0,
			loop: 0,
			portrait: 0,
			title: 0
		};

		return 'https://player.vimeo.com/video/' + videoId + '?' + QueryString.stringify(args);
	}

	updateURL = (props, id) => {
		const url = this.buildURL(props, id);
		this.setState({
			scope: url.split('?')[0],
			playerURL: url
		});
	}


	getPlayerState () {
		const {videoData, playerState} = this.state;
		const {duration, seconds} = videoData || {};

		return {
			service: Source.service,
			time: seconds * 1000,//convert to milliseconds
			state: playerState || UNSTARTED,
			duration: duration * 1000,//convert to milliseconds
			speed: 1
		};
	}


	getPlayerContext = () => {
		const {iframe} = this;
		return iframe && (iframe.contentWindow || window.frames[iframe.name]);
	}


	onMessage = (event) => {
		const getData = x => typeof x === 'string' ? JSON.parse(x) : x;
		let data = getData(event.data);
		let mappedEvent = VIMEO_EVENTS_TO_HTML5[data.event];
		let handlerName = EventHandlers[mappedEvent];

		event = data.event;

		if (data.player_id !== this.state.id) {
			return;
		}

		logger.debug('Vimeo Event: %s: %o', event, data.data || data);

		data = data.data;

		if (event === 'error') {
			//console.warn(`Vimeo Error: ${data.code}: ${data.message}`);
			//Make the view just hide the poster so the viewer can tap the embeded player's play button.
			mappedEvent = 'playing';
			handlerName = EventHandlers.playing;
		}
		else if (event === 'ready') {
			this.postMessage('addEventListener', 'play');	//playing
			this.postMessage('addEventListener', 'pause');	//pause
			this.postMessage('addEventListener', 'finish');	//ended
			this.postMessage('addEventListener', 'seek');	//seeked
			this.postMessage('addEventListener', 'playProgress'); //timeupdate
			// this.flushQueue();
		}


		this.setState({
			videoData: data
		});

		if(mappedEvent && handlerName) {
			this.props[handlerName]({
				timeStamp: Date.now(),
				target: {
					currentTime: data && data.seconds,
					duration: data && data.duration
				},
				type: mappedEvent
			});

			if (this[handlerName]) {
				this[handlerName]();
			}
		}
	}


	postMessage = (method, params) => {
		let context = this.getPlayerContext(), data;
		if (!context) {
			logger.warn(this.state.id, ' No Player Context!');
			return;
		}

		data = {
			method: method,
			value: params
		};

		context.postMessage(JSON.stringify(data), this.state.scope);
	}


	render () {

		if (!this.state.playerURL) {
			return (<div>No source</div>);
		}

		const {id} = this.state;

		return (
			<iframe
				name={id}
				ref={this.attachRef}
				src={this.state.playerURL}
				frameBorder="0"
				allowFullScreen
				allowTransparency
			/>
		);
	}


	onPlaying () {
		this.setState({playerState: PLAYING});
	}


	onEnded () {
		this.setState({playerState: ENDED});
	}


	onPause () {
		this.setState({playerState: PAUSED});
	}


	play = () => {
		//ready?
		this.postMessage('play');
		//else queue.
	};

	pause = () => {
		this.postMessage('pause');
	};

	stop = () => {
		this.postMessage('stop');
	};

	setCurrentTime = (time) => {
		this.postMessage('seekTo', time);
	};
}
