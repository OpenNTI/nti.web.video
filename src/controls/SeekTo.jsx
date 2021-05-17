import React from 'react';
import PropTypes from 'prop-types';

import {Button} from '@nti/web-commons';

import {usePlayer} from '../Context';

/** @typedef {number} Time */
/**
 * @typedef {Object} SeekToProps
 * @property {Time}	time - Time to seek to in seconds
 * @property {() => void} onClick - Callback handler for click events
 */

/**
 * Render a button that seeks the current player in the VideoContext to the given time.
 *
 * @param {SeekToProps} props
 * @returns {React.ReactElement}
 */
export default function SeekTo ({time, onClick:onClickProp, ...otherProps}) {
	const player = usePlayer();

	const onClick = React.useCallback((e) => {
		onClickProp?.(e);

		if (!e.defaultPrevented) {
			player?.setCurrentTime(time);
		}
	}, [player, time, onClickProp]);

	return (
		<Button
			plain
			onClick={onClick}
			disabled={!player}
			{...otherProps}
		/>
	);
}

SeekTo.propTypes = {
	/**Time to seek to in seconds */
	time: PropTypes.number,
	onClick: PropTypes.func
};
