import React from 'react';
import cx from 'classnames';

import { Layouts, Hooks } from '@nti/web-commons';

import { Resume } from './Resume';
import { WatchedSegments } from './WatchedSegments';

const { Slot } = Layouts;

const styles = stylesheet`
	.dark-button:global(.nti-button) {
		background-color: rgba(var(--secondary-background-rgb),0.75);
		box-shadow: 0 0 0 1px var(--primary-blue);
		color: var(--primary-blue);

		&.selected {
			background-color: var(--primary-blue);
			color: white;
		}
	}

	.light-button:global(.nti-button) {
		&.selected {
			background-color: var(--quad-grey);
			box-shadow: none;
		}
	}
`;

const Bar = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	margin-bottom: 1rem;

	& > *:not(:last-child) {
		margin-right: 1rem;
	}
`;

const WatchedContainer = styled.div`
	margin-top: 1rem;
	padding: 1.125rem 1.25rem 0.875rem;
	background: var(--quad-grey);
	border-radius: 4px;

	&.dark {
		background: var(--secondary-background);
	}
`;

/**
 * Video Control Bar
 *
 * @param {{children:*, dark:boolean}} props
 * @returns {JSX.Element}
 */
export function ControlBar({ children, dark, ...props }) {
	const watchedId = Hooks.useId('watchedsegments');
	const [showWatched, setShowWatched] = React.useState(false);
	const toggleShowWatched = React.useCallback(
		() => setShowWatched(!showWatched),
		[showWatched, setShowWatched]
	);

	const PropsByCmp = {
		[WatchedSegments.Trigger]: {
			onClick: toggleShowWatched,
			'aria-expanded': showWatched,
			'aria-controls': watchedId,
			rounded: true,
			inverted: !dark,
			className: cx({
				[styles.darkButton]: dark,
				[styles.lightButton]: !dark,
				[styles.selected]: showWatched,
			}),
		},
		[Resume]: {
			rounded: true,
			inverted: !dark,
			className: cx({
				[styles.darkButton]: dark,
				[styles.selected]: !showWatched,
			}),
		},
	};

	return (
		<div {...props}>
			<Bar>
				<Slot.List
					slots={[Resume, WatchedSegments.Trigger]}
					map={(slot, child) => {
						const extraProps = PropsByCmp[slot];

						return extraProps
							? React.cloneElement(child, extraProps)
							: child;
					}}
					children={children}
				/>
			</Bar>
			{Slot.exists(WatchedSegments.Trigger, children) && (
				<div id={watchedId}>
					{showWatched && (
						<WatchedContainer dark={dark}>
							<WatchedSegments dark={dark} />
						</WatchedContainer>
					)}
				</div>
			)}
		</div>
	);
}
