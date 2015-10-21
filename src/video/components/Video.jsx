import React from 'react';
import {getHandler} from '../services';

import Fallback from '../services/html5';

import emptyFunction from 'fbjs/lib/emptyFunction';

export default React.createClass({
	displayName: 'Video',


	propTypes: {
		src: React.PropTypes.string.isRequired,

		onTimeUpdate: React.PropTypes.func,
		onSeeked: React.PropTypes.func,
		onPlaying: React.PropTypes.func,
		onPause: React.PropTypes.func,
		onEnded: React.PropTypes.func,


		deferred: React.PropTypes.bool
	},


	getInitialState () {
		return {};
	},


	getDefaultProps () {
		return {
			onTimeUpdate: emptyFunction,
			onSeeked: emptyFunction,
			onPlaying: emptyFunction,
			onPause: emptyFunction,
			onEnded: emptyFunction
		};
	},


	onTimeUpdate (event) {
		this.props.onTimeUpdate(event);
	},


	onSeeked (event) {
		this.props.onSeeked(event);
	},


	onPlaying (event) {
		this.props.onPlaying(event);
	},


	onPause (event) {
		this.props.onPause(event);
	},


	onEnded (event) {
		this.props.onEnded(event);
	},


	play  () {
		this.refs.activeVideo.play();
	},


	pause  () {
		this.refs.activeVideo.pause();
	},


	stop  () {
		this.refs.activeVideo.stop();
	},


	setCurrentTime (time) {
		this.refs.activeVideo.setCurrentTime(time);
	},


	render () {
		let video = this.props.src;
		let Provider = getHandler(video) || Fallback;
		let videoSource = video && (video.sources || {})[0];

		return (
			<div className={'flex-video widescreen ' + Provider.displayName}>
				<Provider {...this.props}
					ref="activeVideo"
					source={videoSource || video}
					onTimeUpdate={this.onTimeUpdate}
					onSeeked={this.onSeeked}
					onPlaying={this.onPlaying}
					onPause={this.onPause}
					onEnded={this.onEnded}
					/>
			</div>
		);
	}
});
