import React from 'react';
import PropTypes from 'prop-types';
import Logger from 'nti-util-logger';

import {getHandler} from './services';
import Fallback from './services/html5';

const emptyFunction = () => {};
const commands = Logger.get('video:commands');
const events = Logger.get('video:events');

export default class extends React.Component {
	static displayName = 'Video';

	static propTypes = {
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


	attachRef = (x) => this.activeVideo = x


	componentWillUnmount () {
		try {
			this.stop();
		} catch (e) {
			//don't care
		}
	}

	onError = () => {
		if (this.props.onError) {
			this.props.onError();
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
		const video = this.props.src;
		const Provider = getHandler(video) || Fallback;
		const videoSource = video && (video.sources || {})[0];

		return (
			<div className={'flex-video widescreen ' + Provider.displayName}>
				<Provider {...this.props}
					ref={this.attachRef}
					source={videoSource || video}
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
