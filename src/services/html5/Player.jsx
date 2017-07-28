import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Logger from 'nti-util-logger';

import {createNonRecoverableError} from '../utils';
import {Overlay as ControlsOverlay} from '../../controls';
import {UNSTARTED, PLAYING, PAUSED, ENDED} from '../../Constants';

const commands = Logger.get('video:html5:commands');
const events = Logger.get('video:html5:events');



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
		onError: PropTypes.func
	}


	state = {
		error: false,
		interacted: false,
		videoState: {}
	}


	attachRef = (x) => this.video = x


	componentWillUnmount () {
		this.isUnmounted = true;
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
		let {source} = props;

		if (source.source) {
			source = source.source;
		}

		events.debug('Setting source: entryId: %s, partnerId: %s', source);
		this.setState({src: source});

		if (this.state.error) {
			this.onError();
		}
	}


	getVideoState () {
		const {video} = this;
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
			playbackRate: get('playbackRate', 1)
		};
	}


	render () {
		const {deferred, poster, ...otherProps} = this.props;
		const {error, src, interacted} = this.state;
		const cls = cx('video-wrapper', 'html5-video-wrapper', {error, interacted});

		const loadVideo = !error && (!deferred || interacted);//if we have an error or we are deferred and we haven't been interacted with

		const videoState = this.getVideoState();

		const videoProps = {
			...otherProps,
			controls: false,
			onClick: this.onClick
		};

		delete videoProps.source;
		delete videoProps.src;

		return (
			<div className={cls}>
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
				>
					{loadVideo && this.renderSources(src)}
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
				/>
			</div>
		);
	}


	renderSources (sources) {
		if (!Array.isArray(sources)) {
			sources = [sources];
		}

		return sources
			.map((src, index) => {
				const srcURL = src.src ? src.src : src;
				const type = src.type ? src.type : null;

				if (typeof srcURL !== 'string') {
					events.debug('Invalid Source: %o', src);
					return null;
				}

				return (
					<source key={index} src={srcURL} type={type} />
				);
			})
			.filter(x => !!x);
	}


	renderTracks () {
		//TODO: fill this out
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

		this.forceUpdate();//Force the controls to redraw

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
}
