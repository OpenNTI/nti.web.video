import './LowerControls.scss';
import PropTypes from 'prop-types';
import cx from 'classnames';

import PlayPause from './components/PlayPause';
import GoBackFifteen from './components/GoBackFifteen';
import Scrubber from './components/Scrubber';
import TimeRemaining from './components/TimeRemaining';
import More from './components/More';

LowerVideoControls.propTypes = {
	className: PropTypes.string,
};
export default function LowerVideoControls({ className, ...otherProps }) {
	return (
		<div className={cx('lower-video-controls', className)}>
			<PlayPause {...otherProps} />
			<GoBackFifteen {...otherProps} />
			<Scrubber {...otherProps} />
			<TimeRemaining {...otherProps} />
			<More {...otherProps} />
		</div>
	);
}
