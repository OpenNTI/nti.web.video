import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import {Button} from '@nti/web-commons';

import { usePlayer, useTimeUpdate } from '../Context';

export function Segment ({start, end, onClick:onClickProp, classNames, className, ...otherProps}) {
	const player = usePlayer();
	const [active, setActive] = React.useState(false);
	const updateActive = React.useCallback(({target}) => {
		const {currentTime} = target ?? {};
		const isActive = currentTime != null && currentTime >= start && currentTime <= end;

		if (isActive !== active) {
			setActive(isActive);
		}
	}, [active, setActive]);

	useTimeUpdate(
		classNames?.active ? updateActive : null
	);

	const onClick = React.useCallback((e) => {
		onClickProp?.(e);

		if (!e.defaultPrevented) {
			player?.setCurrentTime(start);
		}
	}, [player, start, onClickProp]);

	const stateClasses = {};

	if (classNames?.active) {
		stateClasses[classNames.active] = active;
	}

	return (
		<Button
			plain
			className={cx(className, stateClasses)}
			onClick={onClick}
			disabled={!player}
			{...otherProps}
		/>
	);
}

Segment.propTypes = {
	/** Start of the segment (in seconds) */
	start: PropTypes.number.isRequired,
	/** End of the segment (in seconds) */
	end: PropTypes.number.isRequired,
	onClick: PropTypes.func,
	classNames: PropTypes.shape({
		active: PropTypes.string
	})
}
