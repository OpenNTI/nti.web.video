import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';

import Speed from './Speed';
import Captions from './Captions';

const stop = (e) => {
	e.stopPropagation();
	e.preventDefault();
};

const DEFAULT_TEXT = {
	speed: 'Speed',
	captions: 'Captions',
	back: 'Back'
};

const t = scoped('nti-web-video.controls.more.menu', DEFAULT_TEXT);


export default class VideoMoreMenu extends React.Component {
	static propTypes = {
		videoState: PropTypes.object
	}

	state = {speedActive: false, captionsActive: false}


	setSpeedActive = (e) => {
		stop(e);

		this.setState({
			speedActive: true,
			captionsActive: false
		});
	}


	setCaptionsActive = (e) => {
		stop(e);

		this.setState({
			speedActive: false,
			captionsActive: true
		});
	}


	setTopLevelActive = (e) => {
		stop(e);

		this.setState({
			speedActive: false,
			captionsActive: false
		});
	}


	render () {
		const {videoState, ...otherProps} = this.props;
		const {speedActive, captionsActive} = this.state;
		const cls = cx('video-more-controls-menu', {speed: speedActive, captions: captionsActive});

		return (
			<div className={cls}>
				<div className="top-level">
					{this.renderTopLevelMenu()}
				</div>
				<div className="sub-level">
					<div className="back" onClick={this.setTopLevelActive}>
						<i className="icon-chevron-left" />
						<span>{t('back')}</span>
					</div>
					<div className="sub-level-container">
						{speedActive && (<Speed videoState={videoState} {...otherProps} />)}
						{captionsActive && (<Captions videoState={videoState} {...otherProps} />)}
					</div>
				</div>
			</div>
		);
	}


	renderTopLevelMenu = () => {
		const {videoState} = this.props;

		return (
			<ul>
				<li>
					{this.renderTopLevelMenuItem(t('speed'), Speed.getFormattedPlaybackRate(videoState), true, this.setSpeedActive)}
					{this.renderTopLevelMenuItem(t('captions'), Captions.getFormattedActiveTrack(videoState), Captions.hasPotentialTracks(videoState), this.setCaptionsActive)}
				</li>
			</ul>
		);
	}

	renderTopLevelMenuItem = (label, value, enabled, onSelect) => {
		return (
			<div className={cx('more-control-menu-item', {enabled})} onClick={onSelect}>
				<span className="option-label">{label}</span>
				<span className="option-value">{value}</span>
				<i className="icon-chevron-right" />
			</div>
		);
	}
}
