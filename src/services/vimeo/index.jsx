import React from 'react';
import PropTypes from 'prop-types';
import Player from '@vimeo/player';
import { v4 as uuid } from 'uuid';

import Logger from '@nti/util-logger';
import { isFlag } from '@nti/web-client';
import { Url } from '@nti/lib-commons';

import {
	EventHandlers,
	UNSTARTED,
	ENDED,
	PLAYING,
	PAUSED,
} from '../../Constants';
import {
	resolveCanAccessSource,
	createNonRecoverableError,
	isSameSource,
} from '../utils';

const logger = Logger.get('video:vimeo');
const VIMEO_URL_PARTS =
	/(?:https?:)?\/\/(?:(?:www|player)\.)?vimeo.com\/(?:(?:channels|video)\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?|#)/i;
const VIMEO_PROTOCOL_PARTS = /vimeo:\/\/(\d+\/)?(\d+)/i;

const VIMEO_EVENTS = {
	play: 'playing',
	pause: 'pause',
	finish: 'ended',
	ended: 'ended',
	seek: 'seeked',
	playbackratechange: 'ratechange',
	playProgress: 'timeupdate',
	timeupdate: 'timeupdate',
	seeked: 'seeked',
};

const logRejection = p =>
	p && p.catch && p.catch(e => logger.debug(e.stack || e.message || e));

//TODO: To detect an unrecoverable error try pinging the Vimeo API
//instead of waiting for the to fail. That should catch both cases:
//1) Vimeo is blocked
//2) The video doesn't exist

export default class VimeoVideo extends React.Component {
	static service = 'vimeo';

	static getID(url) {
		/** @see test */

		const getFromCustomProtocol = x => x.match(VIMEO_PROTOCOL_PARTS);
		const getFromURL = x => x.match(VIMEO_URL_PARTS);

		const [, , /*matchedURL*/ /*albumId*/ id] =
			getFromCustomProtocol(url) || getFromURL(url) || [];
		return id || null;
	}

	static async resolveID(url) {
		const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
			url
		)}`;
		const response = await fetch(endpoint);

		if (!response.ok) {
			throw new Error(
				`Invalid: ${response.statusCode}: ${response.statusText}`
			);
		}

		const data = await response.json();
		return data.video_id;
	}

	static getCanonicalURL(url, videoId) {
		const id = videoId || this.getID(url);
		return `https://www.vimeo.com/${id}`;
	}

	static propTypes = {
		source: PropTypes.any.isRequired,
		autoPlay: PropTypes.bool,
		width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
		height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onRateChange: PropTypes.func,
		onSeeked: PropTypes.func,
		onTimeUpdate: PropTypes.func,
		onReady: PropTypes.func,
	};

	iframe = React.createRef();

	constructor(props) {
		super(props);
		const id = uuid();
		this.state = { id };
		this.updateURL(props, id, x => Object.assign(this.state, x));
	}

	componentDidMount() {
		this.ensureAccess(this.props);
		this.setupPlayer();
	}

	componentDidUpdate({ source }, { playerURL }) {
		if (!isSameSource(this.props.source, source)) {
			this.ensureAccess();
			this.updateURL(this.props);
		}

		if (this.state.playerURL !== playerURL) {
			this.setupPlayer();
		}
	}

	componentWillUnmount() {
		this.teardownPlayer();
	}

	teardownPlayer() {
		const { player } = this;
		delete this.player;

		if (!player) {
			return;
		}

		for (let event of Object.keys(VIMEO_EVENTS)) {
			player.off(event);
		}

		logRejection(player.unload());
	}

	setupPlayer() {
		this.teardownPlayer();

		const iframe = this.iframe.current;

		if (!iframe) {
			return;
		}

		this.player = new Player(iframe);
		this.playerData = {};
		// this.player.setAutopause(false);
		logRejection(this.player.ready().then(this.onReady));
		this.player.on('error', this.onError);
		for (let event of Object.keys(VIMEO_EVENTS)) {
			this.player.on(event, data => this.onEvent(event, data));
		}
	}

	onReady = () => {
		logger.debug('Ready');
		const { onReady } = this.props;
		if (onReady) {
			onReady();
		}
	};

	onEvent(event, data) {
		const mappedEvent = VIMEO_EVENTS[event];
		const handlerName = EventHandlers[mappedEvent];

		logger.debug(event, data);

		this.playerData = { ...(this.playerData ?? {}), ...data };
		const videoData = this.playerData;

		if (mappedEvent && handlerName) {
			if (this.props[handlerName]) {
				const mockEvent = {
					timeStamp: Date.now(),
					target: {
						currentTime: videoData?.seconds ?? 0,
						duration: videoData && videoData.duration,
						playbackRate:
							(videoData && videoData.playbackRate) || 1,
					},
					type: mappedEvent,
				};

				if (handlerName === EventHandlers.ratechange) {
					const { playbackRate: oldRate = 1 } = this.state;
					const newRate = mockEvent.target.playbackRate;

					this.setState({ playbackRate: newRate });
					this.props[handlerName](oldRate, newRate, mockEvent);
				} else {
					this.props[handlerName](mockEvent);
				}
			}

			if (this[handlerName]) {
				this[handlerName]();
			}
		}
	}

	async ensureAccess(props = this.props) {
		const { source, onError } = props;

		const onNoAccess = () => {
			const error = createNonRecoverableError(
				'Unable to access vimeo video'
			);

			if (onError) {
				onError(error);
			}
		};

		try {
			const canAccess = await resolveCanAccessSource(source);

			if (!canAccess) {
				onNoAccess();
			}
		} catch (e) {
			onNoAccess(e);
		}
	}

	buildURL = (props, id = this.state.id) => {
		const { source: mediaSource, autoPlay } = props;

		let videoId =
			typeof mediaSource === 'string'
				? VimeoVideo.getID(mediaSource)
				: mediaSource.source;

		if (Array.isArray(videoId)) {
			videoId = videoId[0];
		}

		if (!id) {
			logger.error('Player ID missing');
		}

		const args = {
			api: 1,
			player_id: id,
			//autopause: 0, //we handle this for other videos, but its nice we only have to do this for cross-provider videos.
			autoplay: autoPlay ? 1 : 0,
			badge: 0,
			byline: 0,
			loop: 0,
			portrait: 0,
			title: 0,
		};

		return (
			'https://player.vimeo.com/video/' +
			videoId +
			'?' +
			Url.stringifyQuery(args)
		);
	};

	updateURL = (props, id, updater = x => this.setState(x)) => {
		const url = this.buildURL(props, id);
		updater({
			scope: url.split('?')[0],
			playerURL: url,
		});
	};

	getPlayerState() {
		const { playerState } = this.state;
		const { duration, seconds } = this.playerData || {};

		return {
			service: VimeoVideo.service,
			time: seconds,
			state: playerState || UNSTARTED,
			duration: duration,
			speed: 1,
		};
	}

	render() {
		if (this.state.resetting) {
			return null;
		}

		if (!this.state.playerURL) {
			return <div>No source</div>;
		}

		const { width, height } = this.props;
		const { id } = this.state;

		return (
			<iframe
				allow="autoplay; encrypted-media"
				name={id}
				ref={this.iframe}
				src={this.state.playerURL}
				width={width}
				height={height}
				frameBorder="0"
				allowFullScreen
				role="iframe"
				title="Vimeo video player"
			/>
		);
	}

	onError = data => {
		logger.error(
			`Vimeo Error: ${data.name}: ${data.method || ''}: ${data.message}`
		);
		//Make the view just hide the poster so the viewer can tap the embedded player's play button.
		this.onEvent('play', data);
	};

	onPlaying() {
		this.setState({ playerState: PLAYING });
	}

	onEnded() {
		const id = uuid();
		this.setState({ resetting: true, id }, () => {
			this.updateURL({ ...this.props, autoPlay: false }, id, state => {
				this.setState(
					{
						...state,
						resetting: false,
					},
					() => this.setupPlayer()
				);
			});
		});

		this.setState({ playerState: ENDED });
	}

	onPause() {
		this.setState({ playerState: PAUSED });
	}

	play = () => {
		//ready?
		logRejection(this.player.play());
		this.setState({ playerState: PLAYING });
		//else queue.
	};

	pause = () => {
		logRejection(this.player.pause());
	};

	stop = () => {
		logger.debug('stopping');
		logRejection(this.player.pause());
		logRejection(this.player.setCurrentTime(0));
	};

	setCurrentTime = time => {
		logRejection(this.player.setCurrentTime(time));
	};
}
