import React from 'react';
import PropTypes from 'prop-types';
import { toAnalyticsPath } from 'nti-analytics';
import Logger from 'nti-util-logger';

import Video from './Video';

const logger = Logger.get('video:analytics');

const emptyFunction = () => {};

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


	componentDidMount () {
		this.mounted = true;
	}


	componentWillUnmount () {
		this.mounted = false;
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


	sendAnalyticsEvent (domEvent, eventName, action, additionalData = {}) {
		const {
			context: {analyticsManager: Manager},
			props: {analyticsData: data = {}}
		} = this;

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
			logger.warn('Missing Analytics Manager!');
		}
	}


	onTimeUpdate = (event) => {
		this.sendAnalyticsEvent(event, 'VideoWatch', 'update');
		this.props.onTimeUpdate(event);
	}


	onSeeked = (event) => {
		this.sendAnalyticsEvent(event, 'VideoSkip', 'send');
		this.props.onSeeked(event);
	}


	onPlaying = (event) => {
		this.sendAnalyticsEvent(event, 'VideoWatch', 'start');
		this.props.onPlaying(event);
	}


	onPause = (event) => {
		this.sendAnalyticsEvent(event, 'VideoWatch', 'stop');
		this.props.onPause(event);
	}


	onEnded = (event) => {
		this.sendAnalyticsEvent(event, 'VideoWatch', 'stop');
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
