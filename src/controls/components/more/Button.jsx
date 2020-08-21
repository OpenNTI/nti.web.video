import './Button.scss';
import React from 'react';
import PropTypes from 'prop-types';

export default class MoreButton extends React.Component {
	static propTypes = {
		onClick: PropTypes.func
	}

	onClick = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const {onClick} = this.props;

		if (onClick) {
			onClick(e);
		}
	}


	render () {
		return (
			<div className="video-more-control-button" onClick={this.onClick} />
		);
	}
}
