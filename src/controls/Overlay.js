import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import {hasInteractedWithVideo, isPlaying} from './utils';
import LowerControls from './LowerControls';
import Mask from './Mask';
import UpperControls from './UpperControls';

export default class VideoControlsOverlay extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		videoState: PropTypes.object,
		onPlay: PropTypes.func,
		onPause: PropTypes.func
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

	render () {
		const {videoState, className, ...otherProps} = this.props;
		const interacted = hasInteractedWithVideo(videoState);

		return (
			<div className={cx('video-controls-overlay', className)} onClick={this.onClick}>
				{!interacted && (<Mask {...otherProps} />)}
				{interacted && (<UpperControls className="overlay-upper-controls" videoState={videoState} {...otherProps} />)}
				{interacted && (<LowerControls className="overlay-lower-controls" videoState={videoState} {...otherProps} />)}
			</div>
		);
	}
}
