import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import isTouch from 'nti-util-detection-touch';

import {hasInteractedWithVideo, isPlaying} from './utils';
import LowerControls from './LowerControls';
import Mask from './Mask';
import UpperControls from './UpperControls';

const HIDE_ON_INACTIVE = 5000;
const HIDE_ON_LEAVE = 1000;

export default class VideoControlsOverlay extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		videoState: PropTypes.object,
		onPlay: PropTypes.func,
		onPause: PropTypes.func
	}

	state = {
		showControls: false
	}


	get interacted () {
		const {videoState} = this.props;

		return hasInteractedWithVideo(videoState);
	}

	get canPlay () {
		const {videoState} = this.props;

		return videoState.canPlay;
	}


	get hasSources () {
		const {videoState} = this.props;
		const {sourceGroups} = videoState || {};

		return sourceGroups && sourceGroups.length > 0;
	}


	startHideTimer (timeout) {
		this.stopHideTimer();

		this.hideControlsTimeout = setTimeout(() => {
			this.setState({
				showControls: false
			});
		}, timeout);
	}


	stopHideTimer () {
		clearTimeout(this.hideControlsTimeout);
	}


	togglePlayPause () {
		const {videoState, onPlay, onPause} = this.props;
		const playing = isPlaying(videoState);

		if (playing && onPause) {
			onPause();
		} else if (!playing && onPlay) {
			onPlay();
		}
	}


	onTouch = (e) => {
		const {interacted} = this;
		const {showControls} = this.state;

		this.stopHideTimer();

		this.setState({showControls: true}, () => {
			this.startHideTimer(HIDE_ON_INACTIVE);
		});

		if (showControls || !interacted) {
			this.togglePlayPause();
		}
	}


	onClick = (e) => {
		this.togglePlayPause();
	}

	onMouseOver = () => {
		this.stopHideTimer();

		this.setState({showControls: true});
	}


	onMouseOut = () => {
		this.startHideTimer(HIDE_ON_LEAVE);
	}


	onMouseMove = () => {
		this.stopHideTimer();

		this.setState({showControls: true}, () => {
			this.startHideTimer(HIDE_ON_INACTIVE);
		});
	}

	render () {
		const {interacted, canPlay, hasSources} = this;
		const {videoState, className, ...otherProps} = this.props;
		const {showControls} = this.state;
		const cls = cx('video-controls-overlay', className, {'show-controls': showControls && interacted, 'is-touch': isTouch, 'can-play': canPlay});

		const listeners = isTouch ?
			{onClick: this.onTouch} :
			{onClick: this.onClick, onMouseOver: this.onMouseOver, onMouseOut: this.onMouseOut, onMouseMove: this.onMouseMove};

		return (
			<div className={cls} {...listeners} >
				{(!interacted || !canPlay || !hasSources) && (<Mask buffering={!canPlay} interacted={interacted} hasSources={hasSources} {...otherProps} />)}
				<UpperControls className="overlay-upper-controls" videoState={videoState} {...otherProps} showing={showControls} isTouch={isTouch} />
				<LowerControls className="overlay-lower-controls" videoState={videoState} {...otherProps} showing={showControls} isTouch={isTouch} />
			</div>
		);
	}
}
