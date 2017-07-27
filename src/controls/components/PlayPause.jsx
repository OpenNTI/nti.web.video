import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import {PLAYING} from '../../Constants';

export default class VideoControlsPlay extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			state: PropTypes.number
		}),
		onPlay: PropTypes.func,
		onPause: PropTypes.func
	}

	get isPlaying () {
		const {videoState} = this.props;
		const {state} = videoState || {};

		return state === PLAYING;
	}


	onClick = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const {isPlaying} = this;
		const {onPlay, onPause} = this.props;

		if (isPlaying && onPause) {
			onPause();
		} else if (!isPlaying && onPlay) {
			onPlay();
		}
	}



	render () {
		const {isPlaying} = this;
		const cls = cx('play-pause-control', {playing: isPlaying, paused: !isPlaying});

		return (
			<div className={cls} onClick={this.onClick}>
				<span className="play-icon">PL</span>
				<span className="pause-icon">PA</span>
			</div>
		);
	}
}
