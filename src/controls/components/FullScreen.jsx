import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

export default class VideoFullScreenControl extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			canGoFullScreen: PropTypes.bool,
			isFullscreen: PropTypes.bool
		}),
		goFullScreen: PropTypes.func,
		exitFullScreen: PropTypes.func
	}


	get canGoFullScreen () {
		const {videoState} = this.props;
		const {canGoFullScreen} = videoState || {};

		return canGoFullScreen;
	}


	get isFullScreen () {
		const {videoState} = this.props;
		const {isFullScreen} = videoState || {};

		return isFullScreen;
	}


	toggleFullScreen = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const {isFullScreen} = this;
		const {goFullScreen, exitFullScreen} = this.props;

		if (isFullScreen && exitFullScreen) {
			exitFullScreen();
		} else if (!isFullScreen && goFullScreen) {
			goFullScreen();
		}
	}


	render () {
		const {isFullScreen, canGoFullScreen} = this;

		return !canGoFullScreen ?
			null :
			(
				<div className={cx('video-control-full-screen', {fullscreen: isFullScreen})} onClick={this.toggleFullScreen} />
			);
	}
}
