import React from 'react';
import PropTypes from 'prop-types';

import Slider from '../common/Slider';

const stop = (e) => {
	e.stopPropagation();
	e.preventDefault();
};

export default class VideoVolumeSlider extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			muted: PropTypes.bool,
			volume: PropTypes.number
		}),
		setVolume: PropTypes.func
	}

	get volume () {
		const {videoState} = this.props;
		const {volume:videoVolume, muted} = videoState || {};
		const volume = muted ? 0 : videoVolume;

		return volume != null ? volume * 100 : 100;
	}


	onChange = (value) => {
		const {setVolume} = this.props;

		if (setVolume) {
			setVolume(value / 100);
		}
	}


	render () {
		const {volume} = this;

		return (
			<div className="video-volume-slider-control" onClick={stop}>
				<Slider min={0} max={100} value={volume} onChange={this.onChange} />
			</div>
		);
	}
}
