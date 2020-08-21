import './Player.scss';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Logger from '@nti/util-logger';
import isTouch from '@nti/util-detection-touch';
import HLS from 'hls.js';

import {createNonRecoverableError, getSourceGroups, removeSourcesFromGroups, HLS_TYPE} from '../utils';
import {Overlay as ControlsOverlay} from '../../controls';
import {UNSTARTED, PLAYING, PAUSED, ENDED} from '../../Constants';

const commands = Logger.get('video:html5:commands');
const events = Logger.get('video:html5:events');
const isIE = /(Trident|Edge)\//.test((global.navigator || {}).userAgent);

const fullscreenEvents = [
	'fullscreenchange',
	'webkitfullscreenchange',
	'mozfullscreenchange',
	'MSFullscreenChange'
];

const MediaSourcePropType = PropTypes.shape({
	source: PropTypes.any,
	width: PropTypes.number,
	height: PropTypes.number,
	type: PropTypes.string
});

const initialState = {
	error: false,
	interacted: false,
	videoState: {},
	sourceGroups: [],
	tracks: []
};


export default class HTML5Video extends React.Component {
	static service = 'html5'

	static propTypes = {
		/**
		 * Either a URL string or a source descriptor object.
		 *
		 * @type {string|MediaSource}
		 */
		source: PropTypes.oneOfType([
			PropTypes.string,
			MediaSourcePropType
		]),
		sources: PropTypes.arrayOf(
			PropTypes.oneOfType([
				PropTypes.string,
				MediaSourcePropType
			])
		),

		tracks: PropTypes.any,
		allowNormalTranscripts: PropTypes.bool,
		crossOrigin: PropTypes.string,

		poster: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),

		autoPlay: PropTypes.bool,
		deferred: PropTypes.bool,
		shouldUseNativeControls: PropTypes.bool,

		onReady: PropTypes.func,
		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onSeeked: PropTypes.func,
		onTimeUpdate: PropTypes.func,
		onError: PropTypes.func,
		onVolumeChange: PropTypes.func,
		onRateChange: PropTypes.func
	}


	state = {...initialState}



	attachContainerRef = x => this.container = x


	attachRef = (video) => {
		if (this.hls && this.video !== video) {
			this.detachHLSPolyfill();
		}

		this.video = video;

		if (video) {
			//attempt to tell the WebView to play inline...
			video.setAttribute('webkit-playsinline', true);

			if (this.props.autoPlay) {
				this.play()
					.catch(() => {
						events.debug('Failed to start, resetting state to "UNSTARTED"');
						this.setState({playerState: UNSTARTED});
					});
			}
		}
	}


	componentWillUnmount () {
		this.isUnmounted = true;

		for (let event of fullscreenEvents) {
			document.removeEventListener(event, this.onFullScreenChange);
		}
	}


	componentDidMount () {
		this.setupSource(this.props);
		for (let event of fullscreenEvents) {
			document.addEventListener(event, this.onFullScreenChange);
		}
	}


	componentDidUpdate ({source}) {
		if (source !== this.props.source) {
			this.setState({...initialState});
			this.setupSource(this.props, () => {
				let {video} = this;
				if (video) {
					video.load();
				}
			});
		}
	}


	onFullScreenChange = () => {
		this.onVideoStateUpdate();
	}


	getPlayerState () {
		const {video} = this;
		const {playerState} = this.state;
		const videoState = getStateForVideo(video);

		return  {
			service: HTML5Video.service,
			state: playerState != null ? playerState : UNSTARTED,
			...videoState
		};
	}


	async polyfillHLS (src) {
		if (!HLS.isSupported()) {
			return;
		}

		const ready = HLS.Events.MANIFEST_PARSED;
		const error = HLS.Events.ERROR;
		let {hls} = this;
		if (!hls) {
			hls = this.hls = new HLS();
			this.detachHLSPolyfill = () => {
				delete this.detachHLSPolyfill;
				delete this.hls;
				hls.off(error, this.onHLSError);
				hls.off(ready, this.onManifestParsed);
				hls.detachMedia();
			};
		} else {
			hls.off(ready, this.onManifestParsed);
			hls.detachMedia();
		}

		return new Promise(f => {
			const cont = () => (hls.off(ready, cont), f());

			hls.on(error, this.onHLSError);
			hls.on(ready, this.onManifestParsed);
			hls.on(ready, cont);
			hls.loadSource(src);
			hls.attachMedia(this.video);
		});
	}


	onManifestParsed = () => {
		// const {tracks} = this.state;
		// const newTracks = this.hls.subtitleTracks.filter(x => tracks.includes(x));
		//
		// console.log(newTracks);
		//
		// this.setState({
		// 	tracks: [
		// 		...tracks,
		// 		...newTracks
		// 	]
		// });
		// this.onCanPlay();
		const {state} = this.getVideoState();
		if (state === PLAYING) {
			this.play();
		}
	}


	setupSource ({source, sources, tracks, allowNormalTranscripts} = this.props, callback) {
		const sourceGroups = getSourceGroups(sources || source);
		const preferredGroup = sourceGroups.find(group => group.preferred);

		if (tracks) {
			const noCaptions = tracks.every(x => x.purpose !== 'captions');

			//filter out the tracks that are meant to be used
			//for the transcript in the media viewer if they aren't
			//allowed
			tracks = allowNormalTranscripts && noCaptions ?
				tracks :
				tracks.filter(x => x.purpose !== 'normal');
		} else {
			tracks = [];
		}

		events.debug('Setting source: entryId: %s, partnerId: %s', source);
		this.setState({
			sourceGroups,
			activeSourceGroup: preferredGroup && preferredGroup.name,
			tracks
		}, callback);

		if (this.state.error) {
			this.onError();
		}
	}


	shouldUseNativeControls () {
		const maybe = isTouch && !isIE;
		return this.props.shouldUseNativeControls || maybe;
	}


	getVideoState () {
		const {video, container} = this;
		const {
			playerState,
			userSetTime,
			userSetVolume,
			canPlay,
			sourceGroups,
			activeSourceGroup,
		} = this.state;

		const get = (name, defaultValue = null) => video ? video[name] : defaultValue;

		return {
			state: playerState != null ? playerState : UNSTARTED,
			duration: get('duration', 0),
			currentTime: userSetTime != null ? userSetTime : get('currentTime', 0),
			currentSrc: get('currentSrc'),
			buffered: get('buffered'),
			controls: get('controls', true),
			loop: get('loop', true),
			autoplay: get('autoplay', false),
			muted: get('muted', false),
			volume: userSetVolume != null ? userSetVolume : get('volume', 1),
			textTracks: get('textTracks'),
			playbackRate: get('playbackRate', 1),
			isFullScreen: isFullScreen(container),
			canGoFullScreen: canGoFullScreen(),
			canPlay,
			sourceGroups,
			activeSourceGroup
		};
	}


	getReloadFn () {
		const {video} = this;
		const {currentTime, state} = this.getVideoState();

		return () => {
			if (video) {
				video.load();

				if (state === PLAYING) {
					this.play().catch(() => {});
				}

				this.timeToSetOnLoad = currentTime;
				video.currentTime = currentTime;
			}

		};
	}


	onVideoStateUpdate = () => {
		this.forceUpdate();
	}


	render () {
		const {deferred, poster, ...otherProps} = this.props;
		const {error, interacted} = this.state;
		const videoState = this.getVideoState();
		const {isFullScreen:fullscreen} = videoState;
		const shouldUseNativeControls = this.shouldUseNativeControls();
		const loadVideo = !deferred || interacted;//if we have an error or we are deferred and we haven't been interacted with
		const cls = cx('video-wrapper', 'html5-video-wrapper', {error, loaded: loadVideo, interacted, fullscreen});

		const videoProps = {
			...otherProps,
			controls: shouldUseNativeControls,
			onClick: this.onClick
		};

		delete videoProps.autoPlay;
		delete videoProps.source;
		delete videoProps.sources;
		delete videoProps.src;
		delete videoProps.tracks;
		delete videoProps.onReady;
		delete videoProps.allowNormalTranscripts;

		return (
			<div className={cls} ref={this.attachContainerRef}>
				<video
					{...videoProps}
					ref={this.attachRef}
					onError={this.onError}
					onCanPlay={this.onCanPlay}
					onPlaying={this.onPlaying}
					onPause={this.onPause}
					onEnded={this.onEnded}
					onSeeked={this.onSeeked}
					onTimeUpdate={this.onTimeUpdate}
					onProgress={this.onProgress}
					onVolumeChange={this.onVolumeChange}
					onRateChange={this.onRateChange}
					onWaiting={this.onWaiting}
				>
					{loadVideo && this.renderSources()}
					{loadVideo && this.renderTracks()}
				</video>
				<ControlsOverlay
					className="controls"
					shouldUseNativeControls={shouldUseNativeControls}
					poster={poster}
					videoState={videoState}
					onPlay={this.play}
					onPause={this.pause}
					setCurrentTime={this.setCurrentTime}
					onMute={this.mute}
					onUnmute={this.unmute}
					setVolume={this.setVolume}
					setPlaybackRate={this.setPlaybackRate}
					selectSourceGroup={this.selectSourceGroup}
					selectTrack={this.selectTrack}
					unselectAllTracks={this.unselectAllTracks}
					goFullScreen={this.goFullScreen}
					exitFullScreen={this.exitFullScreen}
				/>
			</div>
		);
	}


	renderSources () {
		const {sourceGroups, activeSourceGroup} = this.state;
		const {sources} = sourceGroups.find(x => x.name === activeSourceGroup) || {};

		return (sources || [])
			.map((source, index) => {
				const {src, type} = source;

				if (typeof src !== 'string') {
					events.debug('Invalid Source: %o', src);
					return null;
				}

				return (
					<source key={index} src={src} type={type} onError={this.onSourceError} data-raw-src={src} />
				);
			});
	}


	renderTracks () {
		const {tracks} = this.state;

		return tracks
			.map((track, index) => {
				const src = track.src ? track.src : track;
				const lang = track.lang ? track.lang : 'en';
				const purpose = track.purpose && track.purpose !== 'normal' ? track.purpose : 'captions';

				if (typeof src !== 'string') {
					events.debug('Invalid Track: %o', src);
					return null;
				}

				return (
					<track key={index} src={src} srcLang={lang} kind={purpose} label={`${purpose}:${lang}`} />
				);
			});
	}


	onCanPlay = () => {
		const {video} = this;
		const {onReady} = this.props;
		const {playbackRate} = this.getVideoState();

		if (onReady) {
			onReady();
		}

		if (video && this.timeToSetOnLoad) {
			video.currentTime = this.timeToSetOnLoad;
			delete this.timeToSetOnLoad;
		}

		this.setState({
			canPlay: true,
			playbackRate
		}, () => {
			if (this.playWhenAble) {
				this.play();
			}
		});
	}


	onWaiting = () => {
		this.setState({
			canPlay: false
		});
	}


	onPlaying = (e) => {
		events.debug('playing %o', e);

		const {props: {onPlaying}} = this;

		this.setState({playerState: PLAYING});

		if (onPlaying) {
			onPlaying(e);
		}
	}


	onPause = (e) => {
		events.debug('pause %o', e);

		const {props: {onPause}} = this;

		this.setState(state => ({
			playerState: state.playerState === UNSTARTED ? UNSTARTED : PAUSED
		}));

		if (onPause) {
			onPause(e);
		}
	}


	onEnded = (e) => {
		events.debug('ended %o', e);

		const {props: {onEnded}} = this;

		this.setState({playerState: ENDED});

		this.setState({interacted: false}, () => {

			this.setCurrentTime(0);
			this.stop();

		});

		if (onEnded) {
			onEnded(e);
		}
	}


	onSeeked = (e) => {
		events.debug('seeked %o', e);

		const {props: {onSeeked}} = this;
		if (onSeeked) {
			onSeeked(e);
		}
	}


	onTimeUpdate = (e) => {
		events.debug('timeUpdate %o', e);

		const {target: video} = e;
		const {props: {onTimeUpdate}, state: {interacted, playerState, userSetTime}} = this;

		if (playerState === PLAYING && userSetTime != null) {
			this.setState({
				userSetTime: null
			});
		}

		this.onVideoStateUpdate();

		if (!interacted && !video.paused && video.currentTime > 0.05) {
			this.setState({interacted: true});
		}

		if (onTimeUpdate) {
			onTimeUpdate(e);
		}
	}


	onProgress = (e) => {
		events.debug('progressUpdate %o', e);

		this.forceUpdate();//Force the controls to redraw
	}


	removeErroredSources () {
		const reload = this.getReloadFn();
		const { onError } = this.props;
		const { sourceGroups } = this.state;
		const updatedSourceGroups = removeSourcesFromGroups(sourceGroups, this.sourceErrors);
		const preferredGroup = updatedSourceGroups.find(group => group.preferred);

		if (!updatedSourceGroups.length && onError) {
			onError(createNonRecoverableError('Unable to load html5 video.'));
		}

		this.setState(
			{
				sourceGroups: updatedSourceGroups,
				activeSourceGroup: preferredGroup && preferredGroup.name
			},
			() => {
				reload();
			}
		);
	}

	onHLSError = (e) => {
		const {sourceGroups} = this.state;

		if (this.detachHLSPolyfill) {
			this.detachHLSPolyfill();
		}

		this.sourceErrors = this.sourceErrors || {};

		for (let group of sourceGroups) {
			for (let source of group.sources) {
				if (source.type === HLS_TYPE) {
					this.sourceErrors[source.src] = true;
				}
			}
		}

		this.removeErroredSources();
	}

	onSourceError = (e) => {
		e.stopPropagation();

		if (HLS.isSupported() && e.target.type === HLS_TYPE && !this.hls) {
			events.debug('HLS Supported, got error for HLS source: %o\nEvent: %o', e.target, e.nativeEvent);
			this.polyfillHLS(e.target.src);
			return;
		}

		this.sourceErrors = this.sourceErrors || {};
		this.sourceErrors[e.target.getAttribute('data-raw-src')] = true;

		this.removeErroredSources();
	}

	onError = (e) => {
		events.debug('error %o', e);

		this.setState({
			error: 'Could not play video. Network or Browser error.'
		});

		if (this.props.onError) {
			this.props.onError(createNonRecoverableError('Unable to load html5 video.'));
		}
	}

	onVolumeChange = (e) => {
		events.debug('volumechange %o', e);

		this.onVideoStateUpdate();

		if (this.props.onVolumeChange) {
			this.props.onVolumeChange(e);
		}
	}


	onRateChange = (e) => {
		events.debug('ratechange %o', e);

		const {onRateChange = ()=>0} = this.props;
		const {playbackRate:oldRate = 1} = this.state;
		const {playbackRate:newRate} = this.getVideoState();

		this.onVideoStateUpdate();

		this.setState({
			playbackRate:newRate
		});

		onRateChange(oldRate, newRate, e);
	}


	play = async () => {
		const {video} = this;

		this.setState({interacted: true});

		commands.debug('play');

		if (video && !this.isUnmounted) {
			if (video.play) {
				try {
					return await video.play()
						.then(x => (delete this.playWhenAble, x));
				} catch (e) {
					this.playWhenAble = true;
					commands.warn(e);
				}
			}
		}

		return Promise.reject('Could not play.');
	}


	pause = () => {
		const {video} = this;

		commands.debug('pause');

		if (video) {
			if (video.pause) { video.pause(); }
		}
	}


	stop = () => {
		const {video} = this;

		commands.debug('stop');

		if (video && video.stop) {
			video.stop();
		}
	}


	setCurrentTime = (time) => {
		const {video} = this;
		const {playerState} = this.state;

		this.pause();

		//Keep track of the userSetTime to get rid of some lag
		this.setState({
			userSetTime: time
		});

		commands.debug('set currentTime = %s', time);

		if (video) {
			video.currentTime = time;
		}

		if (playerState === PLAYING) {
			this.play();
		}
	}


	mute = () => {
		commands.debug('mute');

		const {video} = this;

		if (video) {
			video.muted = true;
		}

	}


	unmute = () => {
		commands.debug('unmute');

		const {video} = this;

		if (video) {
			video.muted = false;

			if (video.volume === 0) {
				video.volume = 1;
			}
		}
	}


	setVolume = (volume) => {
		commands.debug('set volume = %s', volume);

		//Keep track of the userSetVolume to prevent lag
		this.setState({
			userSetVolume: volume
		});

		clearTimeout(this.clearUserSetVolume);

		this.clearUserSetVolume = setTimeout(() => {
			this.setState({
				userSetVolume: null
			});
		}, 1);

		const {video} = this;

		if (video) {
			video.volume = volume;

			if (video.muted && volume > 0) {
				video.muted = false;
			}
		}
	}


	setPlaybackRate = (rate) => {
		commands.debug('set playback rate = %s', rate);

		const {video} = this;

		if (video) {
			video.playbackRate = rate;
		}
	}


	selectSourceGroup = (group) => {
		const {activeSourceGroup} = this.state;

		if (!group || !group.name || activeSourceGroup === group.name) { return; }

		if (this.detachHLSPolyfill) {
			this.detachHLSPolyfill();
		}

		const reload = this.getReloadFn();

		this.setState({ activeSourceGroup: group.name }, reload);
	}


	selectTrack = (track) => {
		commands.debug('set track = %o', track);

		if (track) {
			track.mode = 'showing';
		}

		this.onVideoStateUpdate();
	}


	unselectAllTracks = () => {
		commands.debug('unselect all tracks');

		const {video} = this;
		const {textTracks} = video || {};
		const tracks = textTracks || [];

		for (let i = 0; i < tracks.length; i++) {
			let track = tracks[i];

			track.mode = 'disabled';
		}

		this.onVideoStateUpdate();
	}


	goFullScreen = () => {
		commands.debug('go full screen');

		//If we are already full screen there's nothing to do
		if (isFullScreen()) { return; }

		const {container, video} = this;

		if (container) {
			requestFullScreen(container, video);
			this.onVideoStateUpdate();
		}
	}


	exitFullScreen = () => {
		commands.debug('exit full screen');

		const {container, video} = this;

		//if we aren't full screen there's nothing to do
		if (!isFullScreen(container)) { return; }

		if (container) {
			exitFullScreen(container, video);
			this.onVideoStateUpdate();
		}
	}
}



export function getStateForVideo (video) {
	return {
		time: video ? video.currentTime : 0,
		duration: video ? video.duration : 0,
		speed: video ? video.playbackRate : 1
	};
}


/*
https://developer.mozilla.org/en-US/Apps/Fundamentals/Audio_and_video_delivery/cross_browser_video_player#Fullscreen
 */
function isFullScreen (elem) {
	const fullscreenElem = document.fullscreenElement
		|| document.mozFullScreenElement
		|| document.webkitFullscreenElement
		|| document.msFullscreenElement;

	return elem && elem === fullscreenElem;
}


function canGoFullScreen () {
	return !!(document.fullscreenEnabled
		|| document.mozFullScreenEnabled
		|| document.msFullscreenEnabled
		|| document.webkitSupportsFullscreen
		|| document.webkitFullscreenEnabled
		|| document.createElement('video').webkitRequestFullScreen
		|| document.createElement('video').webkitEnterFullscreen
	);
}


function requestFullScreen (container, video) {
	const elems = [container, video];
	const fns = [
		'requestFullscreen',
		'mozRequestFullScreen',
		'webkitRequestFullScreen',
		'msRequestFullscreen',
		'webkitEnterFullscreen',
	];

	for (let elem of elems) {
		for (let fn of fns) {
			if (elem[fn]) {
				return elem[fn]();
			}
		}
	}
}


function exitFullScreen (container, video) {
	const elems = [document, container, video];
	const fns = [
		'exitFullscreen',
		'mozCancelFullScreen',
		'webkitCancelFullScreen',
		'webkitExitFullscreen',
		'msExitFullscreen',
	];

	for (let elem of elems) {
		for (let fn of fns) {
			if (elem[fn]) {
				return elem[fn]();
			}
		}
	}
}
