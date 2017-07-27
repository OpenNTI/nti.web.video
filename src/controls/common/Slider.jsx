import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

export default class Slider extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		min: PropTypes.number,
		max: PropTypes.number,
		value: PropTypes.number,
		onChange: PropTypes.func
	}


	onChange = (e) => {
		const {onChange} = this.props;

		if (onChange) {
			onChange(e.target.value);
		}
	}


	render () {
		const {className, min, max, value, ...otherProps} = this.props;
		const cls = cx('nti-slider', className);

		const lowerPercentage = (value / (max - min)) * 100;
		const upperPercentage = 100 - lowerPercentage;

		delete otherProps.onChange;

		return (
			<div className={cls}>
				<div className="track">
					<div className="lower" style={{width: `${lowerPercentage}%`}} />
					<div className="upper" style={{width: `${upperPercentage}%`}} />
				</div>
				<input type="range" min={min} max={max} value={value} onChange={this.onChange} {...otherProps} />
			</div>
		);
	}
}
