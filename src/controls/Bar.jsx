import React from 'react';
import cx from 'classnames';

import { Layouts, Hooks } from '@nti/web-commons';

import useVideoCompletion from '../hooks/use-video-completion';

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

const Container = styled.div`
	margin-bottom: 18px;
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

	const completionObject = useVideoCompletion();

	const alert =
		completionObject?.videoCompletable &&
		completionObject?.watchedTilEnd &&
		!completionObject?.videoCompleted &&
		!completionObject.loading;

	const viewed =
		completionObject?.videoCompletable && completionObject?.videoCompleted;

	React.useEffect(() => {
		/**
		 * Here's why I'm using XOR:
		 * if alert is false and showWatched is false,
		 * 		then I don't wanna do anything cause there's no need to show watched segments
		 * 		so I won't toggle showWatched.
		 * 		FALSE XOR FALSE = FALSE (check)
		 * if alert is true and showWatched is false,
		 * 		I wanna toggle showWatched to make it true and hence show the watched segments.
		 * 		TRUE XOR FALSE = TRUE(check)
		 * if alert is false and showWatched is true,
		 * 		then I wanna hide the watched segments by toggling showWatched to false.
		 * 		FALSE XOR TRUE = TRUE (check)
		 * if alert and showWatched are true,
		 * 		then I don't need to toggle showWatched since I want the user to see watched segments.
		 * 		TRUE XOR TRUE = FALSE (check)
		 */
		if (alert ^ showWatched) {
			toggleShowWatched();
		}
	}, [alert]);

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
			alert,
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
		<Container {...props}>
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
							<WatchedSegments
								dark={dark}
								alert={alert}
								viewed={viewed}
							/>
						</WatchedContainer>
					)}
				</div>
			)}
		</Container>
	);
}
