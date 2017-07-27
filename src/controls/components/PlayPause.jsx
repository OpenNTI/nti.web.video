import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import {isPlaying} from '../utils';

export default class VideoControlsPlayPause extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			state: PropTypes.number
		}),
		onPlay: PropTypes.func,
		onPause: PropTypes.func
	}

	get playing () {
		const {videoState} = this.props;

		return isPlaying(videoState);
	}


	onClick = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const {playing} = this;
		const {onPlay, onPause} = this.props;

		if (playing && onPause) {
			onPause();
		} else if (!playing && onPlay) {
			onPlay();
		}
	}



	render () {
		const {playing} = this;
		const cls = cx('play-pause-control', {playing: playing, paused: !playing});

		return (
			<div className={cls} onClick={this.onClick}>
				<span className="play-icon">PL</span>
				<span className="pause-icon">PA</span>
			</div>
		);
	}
}
