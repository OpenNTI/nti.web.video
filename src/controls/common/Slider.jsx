import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

const normalize = v => parseFloat(v, 10);

export default class Slider extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		min: PropTypes.number,
		max: PropTypes.number,
		value: PropTypes.number,
		onChange: PropTypes.func,
		readOnly: PropTypes.bool,
		noThumb: PropTypes.bool
	}


	attachRef = x => this.container = x


	onChange = (e) => {
		const {onChange} = this.props;

		if (onChange) {
			onChange(normalize(e.target.value));
		}

		this.fromChange = true;
	}


	onClick = (e) => {
		if (this.fromChange) {
			this.fromChange = false;
			return;
		}

		const {container} = this;

		if (!container || !container.getBoundingClientRect) { return; }

		const containerRect = container.getBoundingClientRect();
		const {min, max, onChange} = this.props;
		const {clientX} = e;

		const x = clientX - containerRect.left;
		const per = Math.max(Math.min(x / containerRect.width, 1), 0);//ensure its between 0 and 1

		const newValue = ((max - min) * per) + min;

		if (onChange) {
			onChange(newValue);
		}
	}


	render () {
		const {className, min, max, value, readOnly, noThumb, ...otherProps} = this.props;
		const cls = cx('nti-slider', className, {'no-thumb': noThumb || readOnly});

		const lowerPercentage = (value / (max - min)) * 100;
		const upperPercentage = 100 - lowerPercentage;

		delete otherProps.onChange;

		const coerce = x => isNaN(x) ? null : x;

		return (
			<div className={cls} onClick={this.onClick} ref={this.attachRef} >
				<div className="track">
					<div className="lower" style={{width: `${lowerPercentage}%`}} />
					<div className="upper" style={{width: `${upperPercentage}%`}} />
				</div>
				<input
					type="range"
					min={coerce(min)}
					max={coerce(max)}
					value={coerce(value)}
					onChange={this.onChange}
					{...otherProps}
				/>
			</div>
		);
	}
}
