import React from 'react';
import emptyFunction from 'fbjs/lib/emptyFunction';
import Logger from 'nti-util-logger';

import {getHandler} from './services';
import Fallback from './services/html5';

const commands = Logger.get('video:commands');
const events = Logger.get('video:events');

export default React.createClass({
	displayName: 'Video',


	propTypes: {
		src: React.PropTypes.oneOfType([
			React.PropTypes.string,
			React.PropTypes.object
		]).isRequired,

		onTimeUpdate: React.PropTypes.func,
		onSeeked: React.PropTypes.func,
		onPlaying: React.PropTypes.func,
		onPause: React.PropTypes.func,
		onEnded: React.PropTypes.func,


		deferred: React.PropTypes.bool
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


	componentWillUnmount () {
		try {
			this.stop();
		} catch (e) {
			//don't care
		}
	},


	onTimeUpdate (event) {
		events.debug('timeUpdate %o', event);
		this.props.onTimeUpdate(event);
	},


	onSeeked (event) {
		events.debug('seeked %o', event);
		this.props.onSeeked(event);
	},


	onPlaying (event) {
		events.debug('played %o', event);
		this.props.onPlaying(event);
	},


	onPause (event) {
		events.debug('pause %o', event);
		this.props.onPause(event);
	},


	onEnded (event) {
		events.debug('ended %o', event);
		this.props.onEnded(event);
	},


	play  () {
		commands.debug('Play');
		this.activeVideo.play();
	},


	pause  () {
		commands.debug('Pause');
		this.activeVideo.pause();
	},


	stop  () {
		commands.debug('Stop');
		this.activeVideo.stop();
	},


	setCurrentTime (time) {
		commands.debug('Set CurrentTime %s', time);
		this.activeVideo.setCurrentTime(time);
	},


	render () {
		this.activeVideo = null;
		const video = this.props.src;
		const Provider = getHandler(video) || Fallback;
		const videoSource = video && (video.sources || {})[0];

		return (
			<div className={'flex-video widescreen ' + Provider.displayName}>
				<Provider {...this.props}
					ref={x => this.activeVideo = x}
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
