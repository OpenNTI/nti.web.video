import './Volume.scss';
import PropTypes from 'prop-types';
import cx from 'classnames';

import MuteUnmute from './MuteUnmute';
import VolumeSlider from './VolumeSlider';

VideoVolumeControl.propTypes = {
	isTouch: PropTypes.bool,
};
export default function VideoVolumeControl({ isTouch, ...otherProps }) {
	return (
		<div className={cx('video-volume-control', { 'is-touch': isTouch })}>
			<MuteUnmute {...otherProps} />
			<VolumeSlider {...otherProps} />
		</div>
	);
}
