import React from 'react';
import PropTypes from 'prop-types';
import { toAnalyticsPath } from '@nti/lib-analytics';
import Logger from '@nti/util-logger';

import Video from './Video';

const logger = Logger.get('video:analytics');

const emptyFunction = () => {};

const StopWatchThreshold = 5;

export default class extends React.Component {
	static displayName = 'VideoWrapper';

	static propTypes = {
		/**
		 * The Video source. Either a URL or a Video model.
		 * @type {String|Video}
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
		onRateChange: PropTypes.func,


		deferred: PropTypes.bool,

		/**
		 * An object of properties to send into the analytics events
		 */
		analyticsData: PropTypes.object
	}


	static contextTypes = {
		analyticsManager: PropTypes.object
	}


	static defaultProps = {
		onTimeUpdate: emptyFunction,
		onSeeked: emptyFunction,
		onPlaying: emptyFunction,
		onPause: emptyFunction,
		onEnded: emptyFunction,
		onRateChange: emptyFunction,
	}


	attachRef = (x) => this.activeVideo = x

	getCurrentVideoTarget () {
		const state = this.activeVideo && this.activeVideo.getPlayerState();

		return state ? {currentTime: state.time, duration: state.duration, playbackRate: state.speed} : this.videoTarget;
	}


	componentDidMount () {
		this.mounted = true;
	}

	getSnapshotBeforeUpdate (prevProps) {
		const {analyticsData:data} = this.props;
		const {analyticsData:prevData} = prevProps;

		if (Boolean(data) !== Boolean(prevData) || data.resourceId !== prevData.resourceId) {
			this.resetAnalytics(this.props, prevProps);
		}
	}


	componentWillUnmount () {
		this.mounted = false;
		if (this.isStarted) {
			const target = this.getCurrentVideoTarget();
			this.isStarted = false;
			this.sendAnalyticsEvent({target, type: 'stop'}, 'VideoWatch', 'stop');
		}
		logger.debug('Unmounted');
	}


	resetAnalytics (current, prev) {
		if (this.isStarted) {
			const target = this.getCurrentVideoTarget();
			this.isStarted = false;
			this.sendAnalyticsEvent({target, type: 'stop'}, 'VideoWatch', 'stop', void 0, prev);
		}
	}


	getAnalyticsEventData (action, event, {context = [], ...data} = {}) {
		const {currentTime: videoTime, duration, playbackRate: playSpeed} = event.target;
		return {
			type: event.type,
			context: toAnalyticsPath(context, data.resourceId),
			...data, // withTranscript is/should-be in "data"
			duration,
			playSpeed,
			videoTime,
			...(action === 'start' ? {videoStartTime: videoTime} : {}),
			...(action === 'stop'  ? {videoEndTime: videoTime} : {}),
		};
	}


	sendAnalyticsEvent (domEvent, eventName, action, additionalData = {}, props = this.props) {
		const {analyticsManager:Manager} = this.context;
		const {analyticsData: data = {}} = props;

		if (!data.resourceId) {
			logger.warn('Missing resourceId!');
			return;
		}

		if (Manager) {
			try {
				// This isn't a pattern to replicate blindly. Normaly repeating yourself is better
				// than using string hashes into objects but we don't control the object here so the
				// optimizations cannot be performed anyways...
				Manager[eventName][action](data.resourceId, {
					...this.getAnalyticsEventData(action, domEvent, data),
					...additionalData
				});
			} catch (e) {
				logger.error(e.stack || e.message || e);
			}
		} else {
			if (!this.warnedMissing) {
				this.warnedMissing = true;
				logger.warn('Missing Analytics Manager!');
			}
		}
	}


	onTimeUpdate = (event) => {
		const {target:video} = event;
		const previousTime = this.previousTime;
		const currentTime = video.currentTime ?? 0;
		const diff = previousTime != null ? (currentTime - previousTime) : 0;

		this.previousTime = currentTime;

		if (this.isStarted) {
			if (diff < 0 || diff > StopWatchThreshold) {
				//Stop the current watch event
				this.sendAnalyticsEvent(
					{
						type: 'stop',
						target: {
							currentTime: previousTime,
							duration: video.duration,
							playbackRate: video.playbackRate
						}
					},
					'VideoWatch',
					'stop'
				);

				//start a new watch event
				this.sendAnalyticsEvent(event, 'VideoWatch', 'start');
			} else {
				this.sendAnalyticsEvent(event, 'VideoWatch', 'update');
			}
		}

		this.props.onTimeUpdate(event);
	}


	onSeeked = (event) => {
		this.sendAnalyticsEvent(event, 'VideoSkip', 'send');
		this.props.onSeeked(event);
	}


	onPlaying = (event) => {
		this.sendAnalyticsEvent(event, 'VideoWatch', 'start');
		this.isStarted = true;
		this.videoTarget = event.target;
		this.previousTime = event.target?.currentTime ?? 0;
		this.props.onPlaying(event);
	}


	onPause = (event) => {
		this.sendAnalyticsEvent(event, 'VideoWatch', 'stop');
		this.isStarted = false;
		this.props.onPause(event);
	}


	onEnded = (event) => {
		this.sendAnalyticsEvent(event, 'VideoWatch', 'stop');
		this.isStarted = false;
		this.props.onEnded(event);
	}


	onRateChange = (oldRate, newRate, event) => {
		this.sendAnalyticsEvent(event, 'VideoSpeedChange', 'send', {
			oldPlaySpeed: oldRate,
			newPlaySpeed: newRate
		});
		this.props.onRateChange(oldRate, newRate, event);
	}


	play () {
		this.activeVideo.play();
	}


	pause () {
		this.activeVideo.pause();
	}


	stop () {
		this.activeVideo.stop();
	}


	setCurrentTime (time) {
		this.activeVideo.setCurrentTime(time);
	}


	render () {
		const {...props} = this.props;
		delete props.analyticsData;
		return (
			<Video {...props}
				ref={this.attachRef}
				onTimeUpdate={this.onTimeUpdate}
				onSeeked={this.onSeeked}
				onPlaying={this.onPlaying}
				onPause={this.onPause}
				onEnded={this.onEnded}
				onRateChange={this.onRateChange}
			/>
		);
	}
}
