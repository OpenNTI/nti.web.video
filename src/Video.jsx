import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Logger from 'nti-util-logger';

import {getHandler} from './services';
import Fallback from './services/html5';

const emptyFunction = () => {};
const commands = Logger.get('video:commands');
const events = Logger.get('video:events');

export default class Video extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		src: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.object
		]).isRequired,

		onTimeUpdate: PropTypes.func,
		onSeeked: PropTypes.func,
		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onError: PropTypes.func,

		deferred: PropTypes.bool
	}


	static defaultProps = {
		onTimeUpdate: emptyFunction,
		onSeeked: emptyFunction,
		onPlaying: emptyFunction,
		onPause: emptyFunction,
		onEnded: emptyFunction
	}

	state = {
		activeIndex: 0
	}


	attachRef = (x) => this.activeVideo = x


	getPlayerState () {
		return this.activeVideo && this.activeVideo.getPlayerState();
	}


	componentWillUnmount () {
		try {
			this.stop();
		} catch (e) {
			//don't care
		}
	}

	onError = (e) => {
		if (e && e.nonRecoverable) {
			this.onNonRecoverableError(e);
		}

		if (this.props.onError) {
			this.props.onError(e);
		}
	}


	onNonRecoverableError = () => {
		const {src:video} = this.props;
		const {activeIndex} = this.state;
		const sources = video && video.sources ? video.sources : [];

		if (activeIndex + 1 < sources.length) {
			this.setState({
				activeIndex: activeIndex + 1
			});
		}
	}


	onTimeUpdate = (event) => {
		events.debug('timeUpdate %o', event);
		this.props.onTimeUpdate(event);
	}


	onSeeked = (event) => {
		events.debug('seeked %o', event);
		this.props.onSeeked(event);
	}


	onPlaying = (event) => {
		events.debug('played %o', event);
		this.props.onPlaying(event);
	}


	onPause = (event) => {
		events.debug('pause %o', event);
		this.props.onPause(event);
	}


	onEnded = (event) => {
		events.debug('ended %o', event);
		this.props.onEnded(event);
	}


	play = () => {
		commands.debug('Play');
		this.activeVideo.play();
	}


	pause = () => {
		commands.debug('Pause');
		this.activeVideo.pause();
	}


	stop = () => {
		commands.debug('Stop');
		this.activeVideo.stop();
	}


	setCurrentTime = (time) => {
		commands.debug('Set CurrentTime %s', time);
		this.activeVideo.setCurrentTime(time);
	}


	render () {
		const {src:video, className} = this.props;
		const {activeIndex} = this.state;
		const Provider = getHandler(video, activeIndex) || Fallback;
		const videoSource = video && (video.sources || {})[activeIndex];
		const tracks = (video && video.transcripts) || [];

		return (
			<div className={cx('flex-video', 'widescreen', Provider.service, className)}>
				<Provider {...this.props}
					ref={this.attachRef}
					source={videoSource || video}
					tracks={tracks}
					onTimeUpdate={this.onTimeUpdate}
					onSeeked={this.onSeeked}
					onPlaying={this.onPlaying}
					onPause={this.onPause}
					onEnded={this.onEnded}
					onError={this.onError}
				/>
			</div>
		);
	}
}
