import React from 'react';
import PropTypes from 'prop-types';
import Logger from 'nti-util-logger';

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

		autoPlay: PropTypes.bool,

		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onSeeked: PropTypes.func,
		onTimeUpdate: PropTypes.func,
		onError: PropTypes.func
	}


	state = {
		error: false,
		interacted: false
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
			state: playerState || UNSTARTED,
			...videoState
		};
	}


	setupSource (props) {
		let {source} = props;
		if (typeof source !== 'string') {
			events.warn('What is this? %o', source);
			source = null;
		}

		events.debug('Setting source: entryId: %s, partnerId: %s', source);
		this.setState({src: source});

		if (this.state.error) {
			this.onError();
		}
	}


	render () {
		const {error, interacted, src} = this.state;

		const videoProps = {
			...this.props,
			controls: true,
			src,
			source: null,
			onClick: this.onClick
		};

		Object.keys(this.props).forEach(key => {
			if (/^on/i.test(key)) {
				videoProps[key] = null;
			}
		});

		return error ? (
			<div className="error">Unable to load video.</div>
		) : (
			<div className={'video-wrapper ' + (interacted ? 'loaded' : '')}>
				<video {...videoProps}
					ref={this.attachRef}
					onError={this.onError}
					onPlaying={this.onPlaying}
					onPause={this.onPause}
					onEnded={this.onEnded}
					onSeeked={this.onSeeked}
					onTimeUpdate={this.onTimeUpdate}
					/>
				{!interacted && <a className="tap-area play" href="#" onClick={this.onClick} style={{backgroundColor: 'transparent'}}/>}
			</div>
		);
	}


	onPlaying = (e) => {
		const {props: {onPlaying}} = this;
		events.debug('playing %o', e);

		this.setState({playerState: PLAYING});

		if (onPlaying) {
			onPlaying(e);
		}
	}


	onPause = (e) => {
		const {props: {onPause}} = this;
		events.debug('pause %o', e);

		this.setState({playerState: PAUSED});

		if (onPause) {
			onPause(e);
		}
	}


	onEnded = (e) => {
		const {props: {onEnded}} = this;
		events.debug('ended %o', e);

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
		const {props: {onSeeked}} = this;
		events.debug('seeked %o', e);
		if (onSeeked) {
			onSeeked(e);
		}
	}


	onTimeUpdate = (e) => {
		const {target: video} = e;
		const {props: {onTimeUpdate}, state: {interacted}} = this;
		events.debug('timeUpdate %o', e);

		if (!interacted && !video.paused && video.currentTime > 0.05) {
			this.setState({interacted: true});
		}

		if (onTimeUpdate) {
			onTimeUpdate(e);
		}
	}


	onError = (e) => {
		events.debug('error %o', e);
		this.setState({
			error: 'Could not play video. Network or Browser error.'
		});

		if (this.props.onError) {
			this.props.onError();
		}
	}


	onClick = (e) => {
		const {state: {interacted}, video} = this;

		if (e) {
			e.stopPropagation();
		}

		if (interacted && /Gecko\//.test(navigator.userAgent)) {
			return;
		}

		if (e) {
			e.preventDefault();
		}

		if (video) {
			if (video.paused || video.ended) {
				this.play();
			} else {
				this.pause();
			}
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

		commands.debug('set currentTime = %s', time);

		if (video) {
			video.currentTime = time;
		}
	}
}
