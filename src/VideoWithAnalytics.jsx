import React from 'react';
import PropTypes from 'prop-types';
import Logger from 'nti-util-logger';
import {
	eventStarted,
	eventEnded,
	toAnalyticsPath,
	WatchVideoEvent
} from 'nti-analytics';

import Video from './Video';

const logger = Logger.get('video:component:VideoWrapper');

const emptyFunction = () => {};

function deprecated (o, k) { if (o[k]) { return new Error(`Deprecated prop: \`${k}\`, use \`newWatchEventFactory\` callback prop.`); } }

export default class extends React.Component {
	static displayName = 'VideoWrapper';

	static propTypes = {
		context: deprecated,
		courseId: deprecated,
		transcript: deprecated,


		/**
		 * The Video source. Either a URL or a Video model.
		 * @type {String/Video}
		 */
		src: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.object
		]).isRequired,


		/**
		 * @callback onTimeUpdate
		 * @param {float} time - the position in the video in seconds. (float)
		 */

		/**
		 * Callback for time updates as video plays.
		 *
		 * @type {onTimeUpdate}
		 */
		onTimeUpdate: PropTypes.func,
		onSeeked: PropTypes.func,
		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,


		deferred: PropTypes.bool,

		/**
		 * A factory method to construct a contextually relevant WatchVideoEvent.
		 * The one and only argument will be the video element to read off the
		 * currentTime and duration of the video.
		 *
		 * The factory should return a new WatchVideoEvent instance.
		 */
		newWatchEventFactory: PropTypes.func.isRequired
	}


	static defaultProps = {
		onTimeUpdate: emptyFunction,
		onSeeked: emptyFunction,
		onPlaying: emptyFunction,
		onPause: emptyFunction,
		onEnded: emptyFunction
	}


	state = {
		// keep track of the play start event so we can push analytics including duration
		// when the video is paused, stopped, seeked, or ends.
		playStartEvent: null
	}


	attachRef = (x) => this.activeVideo = x


	componentDidMount () {
		this.mounted = true;
	}

	componentWillUnmount () {
		this.mounted = false;

		let {playStartEvent} = this.state;

		if (playStartEvent) {
			eventEnded(playStartEvent);
		}

	}


	getAnalyticsEventData = (event) => {
		return {
			// timestamp: event.timeStamp,
			target: event.target,
			currentTime: event.target.currentTime,
			duration: event.target.duration,
			type: event.type
		};
	}


	recordPlaybackStarted = (event) => {
		if (this.state.playStartEvent) {
			// this can be triggered by a tap on the transcript, which jumps the video to that location.
			logger.warn('We already have a playStartEvent. How did we get another one without a ' +
						'pause/stop/seek/end in between?');
			let e = this.state.playStartEvent;
			e.finish();
			eventEnded(e);
		}

		if (this.mounted) {
			let analyticsEvent = this.newWatchVideoEvent(event);
			if (analyticsEvent) {
				eventStarted(analyticsEvent);
				this.setState({
					playStartEvent: analyticsEvent
				});
			}
			return analyticsEvent;
		}
	}


	newWatchVideoEvent = (browserEvent) => {
		let {newWatchEventFactory, src} = this.props;

		if (!src.ntiid) {
			logger.warn('No ntiid. Skipping WatchVideoEvent instantiation.');
			return null;
		}

		let target = (browserEvent || {}).target || {currentTime: 0, duration: 0};

		if (newWatchEventFactory) {
			return newWatchEventFactory(target);
		}

		//FIXME: The rest of the this code should move to the host component
		//the Context, courseId, transcript etc are all not universally relevant

		if (process.env.NODE_ENV !== 'production') {
			logger.error('TODO: Move the rest of this method to be passed as an event factory');
		}

		let {context, courseId, transcript} = this.props;

		let analyticsEvent = new WatchVideoEvent(
			src.ntiid,
			courseId, // courseId won't be relevant on Books
			toAnalyticsPath(context || []),
			target.currentTime, // video_start_time
			target.duration, // MaxDuration, the length of the entire video
			!!transcript // transcript is not used by this component, so its superfluous.
		);

		return analyticsEvent;
	}


	recordPlaybackStopped = (event) => {
		let {playStartEvent} = this.state;
		if (!playStartEvent) {
			logger.warn('We don\'t have a playStartEvent. Dropping playbackStopped event on the floor.');
			return;
		}

		playStartEvent.finish(event.target.currentTime);
		eventEnded(playStartEvent);

		if (this.mounted) {
			this.setState({playStartEvent: null});
		}
	}


	onTimeUpdate = (event) => {
		this.props.onTimeUpdate(event);
	}


	onSeeked = (event) => {
		this.props.onSeeked(event);
	}


	onPlaying = (event) => {
		// as soon as it starts, record an empty event. (matches webapp behavior)
		// we do this so if the user closes the window we still ahve a record of them having played the video.
		// this.emitEmptyAnalyticsEvent();

		this.recordPlaybackStarted(event);
		this.props.onPlaying(event);
	}


	onPause = (event) => {
		this.recordPlaybackStopped(event);
		this.props.onPause(event);
	}


	onEnded = (event) => {
		this.recordPlaybackStopped(event);
		this.props.onEnded(event);
	}


	play = () => {
		this.activeVideo.play();
	}


	pause = () => {
		this.activeVideo.pause();
	}


	stop = () => {
		this.activeVideo.stop();
	}


	setCurrentTime = (time) => {
		this.activeVideo.setCurrentTime(time);
	}


	render () {
		return (
			<Video {...this.props}
				ref={this.attachRef}
				onTimeUpdate={this.onTimeUpdate}
				onSeeked={this.onSeeked}
				onPlaying={this.onPlaying}
				onPause={this.onPause}
				onEnded={this.onEnded}
				/>
		);
	}
}
