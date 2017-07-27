import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

UpperVideoControls.propTypes = {
	className: PropTypes.string
};
export default function UpperVideoControls ({className, ...otherProps}) {
	return (
		<div className={cx('upper-video-controls', className)}>
			<span>Upper Controls</span>
		</div>
	);
}
