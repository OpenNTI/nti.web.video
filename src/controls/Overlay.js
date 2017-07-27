import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import LowerControls from './LowerControls';
import UpperControls from './UpperControls';

VideoControlsOverlay.propTypes = {
	className: PropTypes.string
};
export default function VideoControlsOverlay ({className, ...otherProps}) {
	return (
		<div className={cx('video-controls-overlay', className)}>
			<UpperControls className="overlay-upper-controls" {...otherProps} />
			<LowerControls className="overlay-lower-controls" {...otherProps} />
		</div>
	);
}
