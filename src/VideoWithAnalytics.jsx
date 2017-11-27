import React from 'react';
import PropTypes from 'prop-types';
import { toAnalyticsPath } from 'nti-analytics';

import Video from './Video';


const emptyFunction = () => {};

export default class extends React.Component {
	static displayName = 'VideoWrapper';

	static propTypes = {
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
		onEnded: emptyFunction
	}


	attachRef = (x) => this.activeVideo = x


	componentDidMount () {
		this.mounted = true;
	}

	componentWillUnmount () {
		this.mounted = false;
	}


	getAnalyticsEventData = (event, {context = [], ...data} = {}) => {
		return {
			...data,
			context: toAnalyticsPath(context, data.resourceId),
			target: event.target,
			currentTime: event.target.currentTime,
			duration: event.target.duration,
			type: event.type
		};
	}


	recordPlaybackStarted = (event) => {
		const {
			context: {analyticsManager: Manager},
			props: {analyticsData: data = {}}
		} = this;

		if (Manager) {
			Manager.VideoWatch.start(data.resourceId, this.getAnalyticsEventData(event, data));
		}
	}


	recordPlaybackStopped = (event) => {
		const {
			context: {analyticsManager: Manager},
			props: {analyticsData: data = {}}
		} = this;

		if (Manager) {
			Manager.VideoWatch.stop(data.resourceId, this.getAnalyticsEventData(event, data));
		}
	}


	onTimeUpdate = (event) => {
		this.props.onTimeUpdate(event);
	}


	onSeeked = (event) => {
		this.props.onSeeked(event);
	}


	onPlaying = (event) => {
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
