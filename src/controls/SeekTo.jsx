import React from 'react';
import PropTypes from 'prop-types';

import { Button } from "@nti/web-core";

import { usePlayer } from '../Context';

/** @typedef {number} Time */
/**
 * @typedef {Object} SeekToProps
 * @property {Time}	time - Time to seek to in seconds
 * @property {(event: Event) => void} onClick - Callback handler for click events
 */

export const useSeekHandler = (time, onClick) => {
	const player = usePlayer();

	return React.useCallback(
		e => {
			onClick?.(e);

			if (!e.defaultPrevented) {
				player?.play();
				player?.setCurrentTime(time);
			}
		},
		[player, time, onClick]
	);
};

/**
 * Render a button that seeks the current player in the VideoContext to the given time.
 *
 * @param {SeekToProps} props
 * @returns {React.ReactElement}
 */
function SeekToCmp({
	time,
	onClick: onClickProp,
	as: tag,
	innerRef,
	...otherProps
}) {
	const Cmp = tag || Button;
	const player = usePlayer();

	const onClick = useSeekHandler(time, onClickProp);

	return (
		<Cmp
			onClick={onClick}
			disabled={!player}
			ref={innerRef}
			{...otherProps}
		/>
	);
}

SeekToCmp.propTypes = {
	/**Time to seek to in seconds */
	time: PropTypes.number,
	onClick: PropTypes.func,
	as: PropTypes.any,
	innerRef: PropTypes.any,
};

export const SeekTo = React.forwardRef((props, ref) => (
	<SeekToCmp {...props} innerRef={ref} />
));
