import React from 'react';
import PropTypes from 'prop-types';

import {Button} from '@nti/web-commons';

import {usePlayer} from '../Context';

/** @typedef {number} Time */
/** @typedef {{time:Time, onClick:Function}} Props */

/**
 * Render a button that seeks the current player in the VideoContext to the given time.
 *
 * @param {*} props
 * @returns {*}
 */
export default function SeekTo ({time, onClick:onClickProp, ...otherProps}) {
	const player = usePlayer();

	const onClick = React.useCallback((e) => {
		player?.setCurrentTime(time);
		onClickProp?.(e);
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
