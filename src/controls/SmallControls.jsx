import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Volume from './components/Volume';
import FullScreen from './components/FullScreen';
import Scrubber from './components/Scrubber';
import PlayPause from './components/PlayPause';


SmallVideoControls.propTypes = {
	className: PropTypes.string
};
export default function SmallVideoControls ({className, ...otherProps}) {
	return (
		<div className={cx('small-video-controls', className)}>
			<div className={cx('play-layer')}>
				<PlayPause {...otherProps} shadow />
			</div>
			<div className={cx('control-layer')}>
				<div className={cx('small-video-controls-upper')}>
					<Volume {...otherProps} />
					<div className="spacer" />
					<FullScreen {...otherProps} />
				</div>
				<div className="spacer" />
				<div className={cx('small-video-controls-lower')}>
					<Scrubber {...otherProps} noThumb />
				</div>
			</div>
		</div>
	);
}
