import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from '@nti/lib-locale';

const DEFAULT_TEXT = {
	slowest: '0.25x',
	slower: '0.5x',
	slow: '0.75x',
	normal: '1x (Normal)' ,
	fast: '1.25x',
	faster: '1.5x',
	fastest: '2x'
};

const t = scoped('web-video.controls.more.menu', DEFAULT_TEXT);


export default class VideoMoreControlSpeed extends React.Component {
	static getPlaybackRate (videoState) {
		const {playbackRate} = videoState || {};

		return playbackRate || 1;
	}

	static getFormattedPlaybackRate (videoState) {
		const rate = this.getPlaybackRate(videoState);

		return `${rate}x`;
	}

	static propTypes = {
		videoState: PropTypes.shape({
			playbackRate: PropTypes.number
		}),
		setPlaybackRate: PropTypes.func
	}

	get playbackRate () {
		const {videoState} = this.props;

		return VideoMoreControlSpeed.getPlaybackRate(videoState);
	}


	setSpeed = (speed, e) => {
		e.stopPropagation();
		e.preventDefault();

		const {setPlaybackRate} = this.props;

		if (setPlaybackRate) {
			setPlaybackRate(speed);
		}
	}


	speeds = [
		// {label: t('slowest'), set: (e) => this.setSpeed(0.25, e), value: 0.25},
		{label: t('slower'), set: (e) => this.setSpeed(0.5, e), value: 0.5},
		{label: t('slow'), set: (e) => this.setSpeed(0.75, e), value: 0.75},
		{label: t('normal'), set: (e) => this.setSpeed(1, e), value: 1},
		{label: t('fast'), set: (e) => this.setSpeed(1.25, e), value: 1.25},
		{label: t('faster'), set: (e) => this.setSpeed(1.5, e), value: 1.5},
		{label: t('fastest'), set: (e) => this.setSpeed(2, e), value: 2}
	]


	render () {
		const {playbackRate} = this;

		return (
			<ul className="video-more-control-speed">
				{this.speeds.map((speed) => {
					const selected = speed.value === playbackRate;

					return (
						<li
							key={speed.value}
							onClick={speed.set}
							className={cx({selected})}
						>
							{selected && (<i className="icon-check" />)}
							<span className="option-label">{speed.label}</span>
						</li>
					);
				})}
			</ul>
		);
	}
}
