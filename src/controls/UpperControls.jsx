import './UpperControls.scss';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Volume from './components/Volume';
import FullScreen from './components/FullScreen';

UpperVideoControls.propTypes = {
	className: PropTypes.string
};
export default function UpperVideoControls ({className, ...otherProps}) {
	return (
		<div className={cx('upper-video-controls', className)}>
			<Volume {...otherProps} />
			<div className="spacer" />
			<FullScreen {...otherProps} />
		</div>
	);
}
