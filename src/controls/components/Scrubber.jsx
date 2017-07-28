import React from 'react';
import PropTypes from 'prop-types';

import Slider from '../common/Slider';

import LoadingProgress from './LoadingProgress';

export default class VideoScrubber extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			duration: PropTypes.number,
			currentTime: PropTypes.number
		}),
		setCurrentTime: PropTypes.func
	}


	onScrub = (currentTime) => {
		const {setCurrentTime} = this.props;

		if (setCurrentTime) {
			setCurrentTime(currentTime);
		}
	}


	render () {
		const {videoState} = this.props;
		const {duration, currentTime} = videoState || {};

		return (
			<div className="video-control-scrubber">
				<LoadingProgress videoState={videoState} />
				<Slider min={0} max={duration} value={currentTime} onChange={this.onScrub} />
			</div>
		);
	}
}
