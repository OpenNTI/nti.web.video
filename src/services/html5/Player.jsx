import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Logger from 'nti-util-logger';

import {createNonRecoverableError} from '../utils';
import {Overlay as ControlsOverlay} from '../../controls';
import {UNSTARTED, PLAYING, PAUSED, ENDED} from '../../Constants';

const commands = Logger.get('video:html5:commands');
const events = Logger.get('video:html5:events');


/*
https://developer.mozilla.org/en-US/Apps/Fundamentals/Audio_and_video_delivery/cross_browser_video_player#Fullscreen
 */
function isFullScreen (elem) {
	const fullscreenElem = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

	return elem && elem === fullscreenElem;
}


function canGoFullScreen () {
	return !!(
		document.fullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled ||
		document.webkitSupportsFullscreen ||
		document.webkitFullscreenEnabled ||
		document.createElement('video').webkitRequestFullScreen ||
		document.createElement('video').webkitEnterFullscreen
	);
}

function requestFullScreen (container, video) {
	const elems = [container, video];

	for (let elem of elems) {
		if (elem.requestFullscreen) {
			return elem.requestFullscreen();
		}

		if (elem.mozRequestFullScreen) {
			return elem.mozRequestFullScreen();
		}

		if (elem.webkitRequestFullScreen) {
			return elem.webkitRequestFullScreen();
		}

		if (elem.msRequestFullscreen) {
			return elem.msRequestFullscreen();
		}

		if (elem.webkitEnterFullscreen) {
			return elem.webkitEnterFullscreen();
		}
	}
}


function exitFullScreen (container, video) {
	if (document.exitFullscreen) {
		return document.exitFullscreen();
	}

	if (document.mozCancelFullScreen) {
		return document.mozCancelFullScreen();
	}

	if (document.webkitCancelFullScreen) {
		return document.webkitCancelFullScreen();
	}

	if (document.msExitFullscreen) {
		return document.msExitFullscreen();
	}

	const elems = [container, video];

	for (let elem of elems) {
		if (elem.webkitExitFullscreen) {
			return elem.webkitExitFullscreen();
		}
	}
}

const fullscreenEvents = [
	'fullscreenchange',
	'webkitfullscreenchange',
	'mozfullscreenchange',
	'MSFullscreenChange'
];


export function getStateForVideo (video) {
	return {
		time: video ? video.currentTime : 0,
		duration: video ? video.duration * 1000 : 0,
		speed: video ? video.playbackRate : 1
	};
}

export default class HTML5Video extends React.Component {
	static service = 'html5'

	static propTypes = {
		/**
		 * Either a URL string or a source descriptor object.
		 *
		 * @type {String/MediaSource}
		 */
		source: PropTypes.any.isRequired,
		tracks: PropTypes.any,


		poster: PropTypes.bool,

		autoPlay: PropTypes.bool,
		deferred: PropTypes.bool,

		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onSeeked: PropTypes.func,
		onTimeUpdate: PropTypes.func,
		onError: PropTypes.func,
		onVolumeChange: PropTypes.func,
		onRateChange: PropTypes.func
	}


	state = {
		error: false,
		interacted: false,
		videoState: {}
	}


	attachRef = (x) => this.video = x
	attachContainerRef = x => this.container = x


	componentWillUnmount () {
		this.isUnmounted = true;

		for (let event of fullscreenEvents) {
			document.removeEventListener(event, this.onFullScreenChange);
		}
	}


	componentWillMount () {
		this.setupSource(this.props);
	}


	componentWillReceiveProps (nextProps) {
		if (this.props.source !== nextProps.source) {
			this.setupSource(nextProps);
		}
	}


	componentDidMount () {
		const {props: {autoPlay}, refs: {video}} = this;

		if (video) {
			//attempt to tell the WebView to play inline...
			video.setAttribute('webkit-playsinline', true);

			if (autoPlay) {
				this.play();
			}
		}

		for (let event of fullscreenEvents) {
			document.addEventListener(event, this.onFullScreenChange);
		}
	}


	componentWillUpdate (nextProps) {
		if (nextProps.source !== this.props.source) {
			this.setState(this.getInitialState());
		}
	}


	componentDidUpdate (prevProps) {
		let {video} = this;
		if (prevProps.source !== this.props.source) {
			if (video) {
				video.load();
			}
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


	setupSource (props) {
		let {source, tracks} = props;

		if (source.source) {
			source = source.source;
		}

		if (tracks) {
			//filter out the tracks that are meant to be used
			//for the transcript in the media viewer
			tracks = tracks.filter(x => x.purpose !== 'normal');
		} else {
			tracks = [];
		}

		events.debug('Setting source: entryId: %s, partnerId: %s', source);
		this.setState({src: source, tracks});

		if (this.state.error) {
			this.onError();
		}
	}


	getVideoState () {
		const {video, container} = this;
		const {playerState, userSetTime, userSetVolume} = this.state;

		const get = (name, defaultValue = null) => video ? video[name] : defaultValue;

		return {
			state: playerState != null ? playerState : UNSTARTED,
			duration: get('duration', 0),
			currentTime: userSetTime != null ? userSetTime : get('currentTime', 0),
			buffered: get('buffered'),
			controls: get('controls', true),
			loop: get('loop', true),
			autoplay: get('autoplay', false),
			muted: get('muted', false),
			volume: userSetVolume != null ? userSetVolume : get('volume', 1),
			textTracks: get('textTracks'),
			playbackRate: get('playbackRate', 1),
			isFullScreen: isFullScreen(container),
			canGoFullScreen: canGoFullScreen()
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

		const loadVideo = !deferred || interacted;//if we have an error or we are deferred and we haven't been interacted with
		const cls = cx('video-wrapper', 'html5-video-wrapper', {error, loaded: loadVideo, interacted, fullscreen});

		const videoProps = {
			...otherProps,
			controls: false,
			onClick: this.onClick
		};

		delete videoProps.source;
		delete videoProps.src;
		delete videoProps.tracks;

		return (
			<div className={cls} ref={this.attachContainerRef}>
				<video
					{...videoProps}
					ref={this.attachRef}
					onError={this.onError}
					onPlaying={this.onPlaying}
					onPause={this.onPause}
					onEnded={this.onEnded}
					onSeeked={this.onSeeked}
					onTimeUpdate={this.onTimeUpdate}
					onProgress={this.onProgress}
					onVolumeChange={this.onVolumeChange}
					onRateChange={this.onRateChange}
				>
					{loadVideo && this.renderSources()}
					{loadVideo && this.renderTracks()}
				</video>
				<ControlsOverlay
					className="controls"
					poster={poster}
					videoState={videoState}
					onPlay={this.play}
					onPause={this.pause}
					setCurrentTime={this.setCurrentTime}
					onMute={this.mute}
					onUnmute={this.unmute}
					setVolume={this.setVolume}
					setPlaybackRate={this.setPlaybackRate}
					selectTrack={this.selectTrack}
					unselectAllTracks={this.unselectAllTracks}
					goFullScreen={this.goFullScreen}
					exitFullScreen={this.exitFullScreen}
				/>
			</div>
		);
	}


	renderSources () {
		const {src} = this.state;
		const sources = Array.isArray(src) ? src : [src];

		return sources
			.map((source, index) => {
				const srcURL = source.src ? source.src : source;
				const type = source.type ? source.type : null;

				if (typeof srcURL !== 'string') {
					events.debug('Invalid Source: %o', src);
					return null;
				}

				return (
					<source key={index} src={srcURL} type={type} onError={this.onSourceError}/>
				);
			})
			.filter(x => !!x);
	}


	renderTracks () {
		const {tracks} = this.state;

		return tracks
			.map((track, index) => {
				const src = track.src ? track.src : track;
				const lang = track.lang ? track.lang : 'en';
				const purpose = track.purpose ? track.purpose : 'captions';

				if (typeof src !== 'string') {
					events.debug('Invalid Track: %o', src);
					return null;
				}

				return (
					<track key={index} src={src} srcLang={lang} kind={purpose} label={`${purpose}:${lang}`} />
				);
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

		this.setState({playerState: PAUSED});

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
		const {props: {onTimeUpdate}, state: {interacted}} = this;

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


	onError = (e) => {
		events.debug('error %o', e);

		this.setState({
			error: 'Could not play video. Network or Browser error.'
		});

		if (this.props.onError) {
			this.props.onError(createNonRecoverableError('Unable to load html5 video.'));
		}
	}


	onSourceError = (e) => {
		e.stopPropagation();

		this.sourceErrors = this.sourceErrors || {};

		this.sourceErrors[e.target.src] = true;

		const {src} = this.state;
		const sources = Array.isArray(src) ? src : [src];

		for (let source of sources) {
			let srcUrl = source.src ? source.src : source;

			if (!this.sourceErrors[srcUrl]) {
				return;
			}
		}

		const {onError} = this.props;

		if (onError) {
			onError(createNonRecoverableError('Unable to load html5 video.'));
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

		this.onVideoStateUpdate();

		if (this.props.onRateChange) {
			this.props.onRateChange(e);
		}
	}


	play = () => {
		const {video} = this;
		this.setState({interacted: true});

		commands.debug('play');

		if (video && !this.isUnmounted) {
			if (video.play) {
				video.play();
			}
		}
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

		//Keep track of the userSetTime to get rid of some lag
		this.setState({
			userSetTime: time
		});

		clearTimeout(this.clearUserSetTime);

		this.clearUserSetTime = setTimeout(() => {
			this.setState({
				userSetTime: null
			});
		}, 1);

		commands.debug('set currentTime = %s', time);

		if (video) {
			video.currentTime = time;
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

		for (let track of tracks) {
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
