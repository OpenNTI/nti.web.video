import './Scrubber.scss';
import React from 'react';
import PropTypes from 'prop-types';

import Slider from '../common/Slider';
import {formatTime} from '../utils';

import LoadingProgress from './LoadingProgress';

const stop = (e) => {
	e.stopPropagation();
	e.preventDefault();
};

export default class VideoScrubber extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			duration: PropTypes.number,
			currentTime: PropTypes.number
		}),
		setCurrentTime: PropTypes.func,
		isTouch: PropTypes.bool,
		readOnly: PropTypes.bool,
		noThumb: PropTypes.bool
	}

	attachWrapperRef = x => this.wrapper = x

	state = {label: null, percentage: 0}


	get duration () {
		const {videoState} = this.props;
		const {duration} = videoState || {};

		return duration;
	}


	get currentTime () {
		const {videoState} = this.props;
		const {currentTime} = videoState || {};

		return currentTime;
	}


	get left () {
		const {wrapper} = this;
		const rect = wrapper ? wrapper.getBoundingClientRect() : { left: 0 };

		return rect.left;
	}


	get width () {
		const {wrapper} = this;

		return wrapper.clientWidth || 0;
	}


	onScrub = (currentTime) => {
		const {setCurrentTime, readOnly} = this.props;

		if (setCurrentTime && !readOnly) {
			setCurrentTime(currentTime);
		}
	}


	onMouseMove = (e) => {
		const {left, width, duration} = this;
		const {clientX} = e;

		const percentage = (clientX - left) / width;
		const label = formatTime(percentage * duration);

		//If the mouse is down the mouse out won't fire
		//so confirm that we are within the bounds of the
		//scrubber
		if (percentage >= 0 && percentage <= 1) {
			this.setState({percentage, label});
		}

	}

	onMouseOut = () => {
		this.setState({
			percentage: null,
			label: null
		});
	}


	render () {
		const {duration, currentTime} = this;
		const {videoState, isTouch, readOnly, noThumb} = this.props;
		const {percentage, label} = this.state;

		return (
			<div ref={this.attachWrapperRef} className="video-control-scrubber" onMouseMove={this.onMouseMove} onMouseOut={this.onMouseOut} onClick={stop}>
				<LoadingProgress videoState={videoState} />
				<Slider min={0} max={duration} value={currentTime} onChange={this.onScrub} readOnly={readOnly} noThumb={noThumb} />
				{label && !isTouch && this.renderTooltip(label, percentage)}
			</div>
		);
	}


	renderTooltip = (label, percentage) => {
		return (
			<div className="video-scrubber-tooltip" style={{left: `${percentage * 100}%`}}>
				<span className="label">{label}</span>
				<div className="arrow" />
			</div>
		);
	}
}
