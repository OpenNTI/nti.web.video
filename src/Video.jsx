import './Video.scss';
import EventEmitter from 'events';

import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Logger from '@nti/util-logger';
import { Decorators, AddClass } from '@nti/web-commons';

import { Context } from './Constants';
import { getHandler } from './services';
import Fallback from './services/html5';

const emptyFunction = () => {};
const commands = Logger.get('video:commands');
const events = Logger.get('video:events');
const busEvents = Logger.get('video:bus-events');

const BUS_EVENTS = {
	BASE_TYPE: 'video-event',
	PAUSE_OTHERS: 'pause-others',
};

class EventBus extends EventEmitter {
	pauseOthers(sender) {
		this.emit(BUS_EVENTS.BASE_TYPE, {
			type: BUS_EVENTS.PAUSE_OTHERS,
			payload: {
				sender,
			},
		});
	}
}

class Video extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		src: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
			.isRequired,

		onTimeUpdate: PropTypes.func,
		onSeeked: PropTypes.func,
		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onError: PropTypes.func,
		onReady: PropTypes.func,

		ignoreEventBus: PropTypes.bool,
		deferred: PropTypes.bool,
		startTime: PropTypes.number,

		fullscreenElement: PropTypes.node
	};

	static contextType = Context;

	static defaultProps = {
		onTimeUpdate: emptyFunction,
		onSeeked: emptyFunction,
		onPlaying: emptyFunction,
		onPause: emptyFunction,
		onEnded: emptyFunction,
	};

	static eventBus = new EventBus();

	state = {
		activeIndex: 0,
		ready: false,
	};

	attachContainer = x => (this.container = x);
	attachRef = x => (this.activeVideo = x);

	constructor(props) {
		super(props);

		if (!props.ignoreEventBus) {
			const { eventBus } = this.constructor;
			eventBus.on(BUS_EVENTS.BASE_TYPE, this.handleBusEvent);
			this.unsubscribe = [
				() => eventBus.off(BUS_EVENTS.BASE_TYPE, this.handleBusEvent),
			];

			eventBus.pauseOthers(this);
		}

		this.commandQueue = [];
	}

	handleBusEvent = ({ type, payload }) => {
		const handler = this[type];
		if (handler) {
			try {
				handler(payload);
			} catch (e) {
				busEvents.error(e);
			}
		}
	};

	[BUS_EVENTS.PAUSE_OTHERS] = ({ sender } = {}) => {
		if (this !== sender) {
			this.pause();
		}
	};

	getPlayerState() {
		return this.activeVideo && this.activeVideo.getPlayerState();
	}

	get isReady() {
		return this.state.ready;
	}

	get srcString() {
		return `${this.props.src}`;
	}

	componentDidMount() {
		this._setupStartTime();
		this._setupFullScreen();

		this.playerContext = this.context?.setupPlayerContext(this);
	}

	componentDidUpdate() {
		this._setupFullScreen();
	}

	componentWillUnmount() {
		this.playerContext?.teardown();
		delete this.playerContext;

		(this.unsubscribe || []).forEach(method => method());
		delete this.unsubscribe;

		try {
			this.stop();
		} catch (e) {
			//don't care
		}
	}

	onError = e => {
		let sourceWillChange = false;

		if (e && e.nonRecoverable) {
			sourceWillChange = this.onNonRecoverableError(e);
		}

		const error = Object.assign(e, { sourceWillChange });

		this.props.onError?.(error);
		this.playerContext?.onError(error);
	};

	onNonRecoverableError = () => {
		const { src: video } = this.props;
		const { activeIndex: oldIndex } = this.state;
		const sources = video && video.sources ? video.sources : [];
		const activeIndex = oldIndex + 1;

		if (activeIndex < sources.length) {
			this.setState({
				activeIndex,
			});

			return true;
		}
	};

	onTimeUpdate = event => {
		events.trace('timeUpdate %o', event);
		this.props.onTimeUpdate(event);
		this.playerContext?.onTimeUpdate(event);
	};

	onSeeked = event => {
		events.debug('seeked', this.srcString);
		events.trace('seeked %o', event);
		this.props.onSeeked(event);
		this.playerContext?.onSeeked(event);
	};

	onPlaying = event => {
		events.debug('played', this.srcString);
		events.trace('played %o', event);
		this.props.onPlaying(event);
		this.playerContext?.onPlaying(event);
	};

	onPause = event => {
		events.debug('pause', this.srcString);
		events.trace('pause %o', event);
		this.props.onPause(event);
		this.playerContext?.onPause(event);
	};

	onEnded = event => {
		events.debug('ended', this.srcString);
		events.trace('ended %o', event);
		this.props.onEnded(event);
		this.playerContext?.onEnded(event);
	};

	onReady = event => {
		events.debug('ready', this.srcString);
		events.trace('ready %o', event);

		const { onReady } = this.props;
		const { ready } = this.state;

		//Don't call on ready more than once
		if (ready) {
			return;
		}

		if (onReady) {
			onReady();
		}

		this.playerContext?.onReady();

		this.setState({ ready: true }, () => {
			for (let command of this.commandQueue) {
				command();
			}

			this.commandQueue = [];
		});
	};

	_setupFullScreen() {
		const { container } = this;
		const { isFullScreen } = this.state;
		const { fullscreenElement } = this.props;

		const setFullScreen = () =>
			!isFullScreen && this.setState({ isFullScreen: true });
		const setNotFullScreen = () =>
			isFullScreen && this.setState({ isFullScreen: false });

		const containsFullScreen =
			container &&
			fullscreenElement &&
			container.contains(fullscreenElement);

		if (containsFullScreen) {
			setFullScreen();
		} else {
			setNotFullScreen();
		}
	}

	_setupStartTime() {
		const { startTime } = this.props;

		if (!startTime) {
			return;
		}

		const setStartTime = () => {
			//Give the video a change to autoplay
			setTimeout(() => {
				this.setCurrentTime(startTime);
			}, 10);
		};

		if (this.isReady) {
			setStartTime();
		} else {
			this.commandQueue.push(setStartTime);
		}
	}

	play = () => {
		commands.debug('Play');

		if (!this.isReady) {
			this.commandQueue.push(() => this.play());
		}

		if (this.isReady || this.props.deferred) {
			this.activeVideo.play();
		}
	};

	pause = () => {
		commands.debug('Pause');

		if (this.isReady) {
			this.activeVideo.pause();
		} else {
			this.commandQueue.push(() => this.pause());
		}
	};

	stop = () => {
		commands.debug('Stop');

		if (this.isReady) {
			this.activeVideo.stop();
		} else {
			this.commandQueue.push(() => this.stop());
		}
	};

	setCurrentTime = time => {
		commands.debug('Set CurrentTime %s', time);

		if (this.isReady) {
			this.activeVideo.setCurrentTime(time);
		} else {
			this.commandQueue.push(() => this.setCurrentTime(time));
		}
	};

	render() {
		const { src: video, className } = this.props;
		const videoProps = { ...this.props };
		const { activeIndex, isFullScreen } = this.state;
		const Provider = getHandler(video, activeIndex) || Fallback;
		const videoSource = video && (video.sources || {})[activeIndex];
		const tracks = (video && video.transcripts) || [];

		delete videoProps.fullscreenElement;
		delete videoProps.startTime;

		return (
			<div
				ref={this.attachContainer}
				className={cx('nti-video', Provider.service, className, {
					fullscreen: isFullScreen,
				})}
			>
				{isFullScreen && <AddClass className="full-screen-video" />}
				<Provider
					{...videoProps}
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

export default Decorators.fullScreenMonitor()(Video);
