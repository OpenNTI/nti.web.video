import React from 'react';
import PropTypes from 'prop-types';

const FIFTEEN = 15;

export default class GoBackFifteen extends React.Component {
	static propTypes = {
		videoState: PropTypes.shape({
			currentTime: PropTypes.number
		}),
		setCurrentTime: PropTypes.func
	}


	onClick = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const {setCurrentTime, videoState} = this.props;
		const {currentTime} = videoState || {};

		const newTime = Math.max(currentTime - FIFTEEN, 0);

		if (setCurrentTime) {
			setCurrentTime(newTime);
		}
	}


	render () {
		return (
			<div className="video-control-go-back-fifteen" onClick={this.onClick} />
		);
	}
}
