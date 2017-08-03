import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

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


	onClick = (e) => {
		const {videoState, onPlay, onPause} = this.props;
		const playing = isPlaying(videoState);

		if (playing && onPause) {
			onPause();
		} else if (!playing && onPlay) {
			onPlay();
		}
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
		const {videoState, className, ...otherProps} = this.props;
		const {showControls} = this.state;
		const interacted = hasInteractedWithVideo(videoState);
		const cls = cx('video-controls-overlay', className, {'show-controls': showControls && interacted});

		return (
			<div className={cls} onClick={this.onClick} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut} onMouseMove={this.onMouseMove} >
				{!interacted && (<Mask {...otherProps} />)}
				<UpperControls className="overlay-upper-controls" videoState={videoState} {...otherProps} showing={showControls} />
				<LowerControls className="overlay-lower-controls" videoState={videoState} {...otherProps} showing={showControls} />
			</div>
		);
	}
}
