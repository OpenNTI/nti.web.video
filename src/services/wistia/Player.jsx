import React from 'react';
import PropTypes from 'prop-types';
import {Models} from '@nti/lib-interfaces';

import {
	UNSTARTED,
	ENDED,
	PLAYING,
	PAUSED
} from '../../Constants';

import WistiaPlayer from './WistiaPlayer';

const {Providers} = Models.media || {};
const {WistiaProvider} = Providers || {};


export default class WistiaVideoPlayer extends React.Component {
	static service = 'wistia';

	static getCanonicalURL (...args) {
		return WistiaProvider.getCanonicalURL(...args);
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
		onReady: PropTypes.func
	}

	state = {
		playerState: UNSTARTED
	}

	attachIframe = (iframe) => {
		if (iframe && iframe !== this.iframe) {
			this.setupPlayer(new WistiaPlayer(iframe));
		}

		this.iframe = iframe;
	}

	componentDidMount () {
		this.setupSource();
	}

	componentWillUnmount () {
		this.tearDownPlayer();
	}

	componentDidUpdate (prevProps) {
		const {source} = this.props;
		const {source: prevSource} = prevProps;

		if (source !== prevSource) {
			this.setupSource();
		}
	}

	setupSource () {
		const {source, autoPlay} = this.props;

		this.setState({
			playerURL: WistiaPlayer.getEmbedURL(source, {autoPlay})
		});
	}

	setupPlayer (player) {
		if (this.player) { this.tearDownPlayer(); }

		this.player = player;

		player.onceReady()
			.then(() => {
				if (this.props.onReady) {
					this.props.onReady();
				}
			});

		player.addListener('play', this.onPlay);
		player.addListener('pause', this.onPause);
		player.addListener('end', this.onEnd);
		player.addListener('timechange', this.onTimeChange);
		player.addListener('ratechange', this.onRateChange);
		player.addListener('seek', this.onSeek);
	}

	tearDownPlayer () {
		if (!this.player) { return; }

		this.player.teardown();
		this.player.removeListener('play', this.onPlay);
		this.player.removeListener('pause', this.onPause);
		this.player.removeListener('end', this.onEnd);
		this.player.removeListener('timechange', this.onTimeChange);
		this.player.removeListener('ratechange', this.onRateChange);
		this.player.removeListener('seek', this.onSeek);
	}

	render () {
		const {playerURL} = this.state;

		if (!playerURL) { return null; }

		const {width, height} = this.props;

		return (
			<iframe
				src={playerURL}
				ref={this.attachIframe}
				width={width}
				height={height}
				allowTransparency
				frameBorder="0"
				scrolling="no"
				allowFullScreen
				role="iframe"
				title="Wistia Video Player"
				className="wistia_embed"
			/>
		);
	}


	getPlayerState () {
		const {playerState} = this.state;
		const state = this.player && this.player.getPlayerState();

		return {
			service: WistiaVideoPlayer.service,
			state: playerState != null ? playerState : UNSTARTED,
			...(state || {})
		};
	}


	onPlay = () => {
		this.setState({playerState: PLAYING});

		if (this.props.onPlaying) {
			this.props.onPlaying({target: this.player});
		}
	}

	onPause = () => {
		this.setState({playerState: PAUSED});

		if (this.props.onPause) {
			this.props.onPause({target: this.player});
		}
	}

	onEnd = () => {
		this.setState({playerState: ENDED});

		if (this.props.onEnded) {
			this.props.onEnded({target: this.player});
		}
	}

	onSeek = () => {
		if (this.props.onSeeked) {
			this.props.onSeeked({target: this.player});
		}
	}

	onTimeChange = () => {
		if (this.props.onTimeUpdate) {
			this.props.onTimeUpdate({target: this.player});
		}
	}

	onRateChange = ({oldRate, newRate}) => {
		if (this.props.onRateChange) {
			this.props.onRateChange(oldRate, newRate, {target: this.player});
		}
	}


	pause = () => {
		if (this.player) {
			this.player.pause();
		}
	}

	play = () => {
		if (this.player) {
			this.player.play();
		}
	}

	stop = () => {
		if (this.player) {
			this.player.pause();
			this.player.setCurrentTime(0);
		}
	}

	setCurrentTime = (time) => {
		if (this.player) {
			this.player.setCurrentTime(time);
		}
	}


}