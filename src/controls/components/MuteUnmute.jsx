import './MuteUnmute.scss';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';


export default class VideoVolumeControl extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			muted: PropTypes.bool,
			volume: PropTypes.number
		}),
		onMute: PropTypes.func,
		onUnmute: PropTypes.func
	}

	get muted () {
		const {videoState} = this.props;
		const {muted:videoMuted, volume} = videoState || {};
		const muted = volume === 0 ? true : videoMuted;

		return muted;
	}


	toggleMuted = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const {muted} = this;
		const {onMute, onUnmute} = this.props;

		if (muted && onUnmute) {
			onUnmute();
		} else if (!muted && onMute) {
			onMute();
		}
	}


	render () {
		const {muted} = this;

		return (
			<div className="video-mute-unmute-control" onClick={this.toggleMuted}>
				<span className={cx('icon', {muted})} title={muted ? 'unmute' : 'mute'}/>
			</div>
		);
	}
}
