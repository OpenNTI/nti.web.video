import EventEmitter from 'events';

import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Logger from '@nti/util-logger';

import {getHandler} from './services';
import Fallback from './services/html5';

const emptyFunction = () => {};
const commands = Logger.get('video:commands');
const events = Logger.get('video:events');
const busEvents = Logger.get('video:bus-events');

const BUS_EVENTS = {
	BASE_TYPE: 'video-event',
	PAUSE_OTHERS: 'pause-others'
};

class EventBus extends EventEmitter {
	pauseOthers (sender) {
		this.emit(BUS_EVENTS.BASE_TYPE, {
			type: BUS_EVENTS.PAUSE_OTHERS,
			payload: {
				sender
			}
		});
	}
}

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
		onReady: PropTypes.func,

		ignoreEventBus: PropTypes.bool,
		deferred: PropTypes.bool
	}

	static defaultProps = {
		onTimeUpdate: emptyFunction,
		onSeeked: emptyFunction,
		onPlaying: emptyFunction,
		onPause: emptyFunction,
		onEnded: emptyFunction
	}

	static eventBus = new EventBus()

	state = {
		activeIndex: 0,
		ready: false
	}


	attachRef = (x) => this.activeVideo = x

	constructor (props) {
		super(props);

		if (!props.ignoreEventBus) {
			const {eventBus} = this.constructor;
			eventBus.on(BUS_EVENTS.BASE_TYPE, this.handleBusEvent);
			this.unsubscribe = [() => eventBus.off(BUS_EVENTS.BASE_TYPE, this.handleBusEvent)];
	
			eventBus.pauseOthers(this);
		}
		
		this.commandQueue = [];
	}

	handleBusEvent = ({type, payload}) => {
		const handler = this[type];
		if (handler) {
			try {
				handler(payload);
			}
			catch (e) {
				busEvents.error(e);
			}
		}
	}

	[BUS_EVENTS.PAUSE_OTHERS] = ({sender} = {}) => {
		if (this !== sender) {
			this.pause();
		}
	}

	getPlayerState () {
		return this.activeVideo && this.activeVideo.getPlayerState();
	}


	get isReady () {
		return this.state.ready;
	}


	componentWillUnmount () {
		(this.unsubscribe || []).forEach(method => method());
		delete this.unsubscribe;

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


	onReady = (event) => {
		events.debug('ready %o', event);

		const {onReady} = this.props;
		const {ready} = this.state;

		//Don't call on ready more than once
		if (ready) { return; }

		if (onReady) {
			onReady();
		}

		this.setState({ready: true}, () => {
			for (let command of this.commandQueue) {
				command();
			}

			this.commandQueue = [];
		});

	}


	play = () => {
		commands.debug('Play');

		if (!this.isReady) {
			this.commandQueue.push(() => this.play());
		}

		if (this.isReady || this.props.deferred) {
			this.activeVideo.play();
		}
	}


	pause = () => {
		commands.debug('Pause');

		if (this.isReady) {
			this.activeVideo.pause();
		} else {
			this.commandQueue.push(() => this.pause());
		}
	}


	stop = () => {
		commands.debug('Stop');

		if (this.isReady) {
			this.activeVideo.stop();
		} else {
			this.commandQueue.push(() => this.stop());
		}
	}


	setCurrentTime = (time) => {
		commands.debug('Set CurrentTime %s', time);

		if (this.isReady) {
			this.activeVideo.setCurrentTime(time);
		} else {
			this.commandQueue.push(() => this.setCurrentTime(time));
		}
	}


	render () {
		const {src: video, className} = this.props;
		const {activeIndex} = this.state;
		const Provider = getHandler(video, activeIndex) || Fallback;
		const videoSource = video && (video.sources || {})[activeIndex];
		const tracks = (video && video.transcripts) || [];

		return (
			<div className={cx(
				'nti-video', Provider.service, className
			)}>
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
					onReady={this.onReady}
				/>
			</div>
		);
	}
}
