import './LoadingProgress.scss';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import {normalizeLoadedBuffer} from '../utils';

VideoLoadingProgress.propTypes = {
	videoState: PropTypes.object
};
export default function VideoLoadingProgress ({videoState}) {
	const ranges = normalizeLoadedBuffer(videoState);

	return (
		<div className="video-loading-progress">
			{ranges.map((range, index) => {
				return (
					<div
						key={index}
						className={cx('range', {loaded: range.loaded})}
						style={{width: `${range.percentage}%`}}
					/>
				);
			})}
		</div>
	);
}
