import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';

import Speed from './Speed';
import Captions from './Captions';
import Quality from './Quality';

const stop = (e) => {
	e.stopPropagation();
	e.preventDefault();
};

const DEFAULT_TEXT = {
	speed: 'Speed',
	captions: 'Captions',
	quality: 'Quality',
	back: 'Back'
};

const t = scoped('nti-web-video.controls.more.menu', DEFAULT_TEXT);


export default class VideoMoreMenu extends React.Component {
	static propTypes = {
		videoState: PropTypes.object
	}

	state = {qualityActive: false, speedActive: false, captionsActive: false}


	setSpeedActive = (e) => {
		stop(e);

		this.setState({
			qualityActive: false,
			speedActive: true,
			captionsActive: false
		});
	}


	setCaptionsActive = (e) => {
		stop(e);

		this.setState({
			qualityActive: false,
			speedActive: false,
			captionsActive: true
		});
	}

	setQualitiesActive = (e) => {
		stop(e);

		this.setState({
			qualityActive: true,
			speedActive: false,
			captionsActive: false
		});
	}

	setTopLevelActive = (e) => {
		stop(e);

		this.setState({
			qualityActive: false,
			speedActive: false,
			captionsActive: false
		});
	}


	render () {
		const {videoState, ...otherProps} = this.props;
		const {speedActive, captionsActive, qualityActive} = this.state;
		const cls = cx('video-more-controls-menu', {speed: speedActive, captions: captionsActive, quality: qualityActive});

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
						{qualityActive && (<Quality videoState={videoState} {...otherProps} />)}
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
					{this.renderTopLevelMenuItem(t('quality'), Quality.getFormattedActiveQuality(videoState), Quality.hasPotentialQualities(videoState), this.setQualitiesActive)}
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
