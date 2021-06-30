/** @typedef {number} Time - video timestamp in seconds */
/** @typedef {{video_start_time:Time, video_end_time: Time}} Segment */

import React, { useState } from 'react';

import {
	Hooks as AnalyticsHooks,
	Manager as AnalyticManager,
} from '@nti/lib-analytics';
import { scoped } from '@nti/lib-locale';
import { Hooks, Text, Button, Icons } from '@nti/web-commons';

import { usePlayer, useDuration } from '../Context';

import getMileStones from './utils/get-mile-stones';
import { getTimeStyle, getDurationStyle } from './utils/get-styles';
import groupAdjoiningSegments from './utils/group-adjoining-segments';

const { useResolver } = Hooks;
const { isPending, isErrored, isResolved } = useResolver;

const VideoWatchType = AnalyticManager.getTypeForEvent('VideoWatch');

const t = scoped('nti-video.controls.WatchedSegments', {
	trigger: 'Watch History',
});

const Container = styled.div`
	cursor: pointer;
`;

const Bar = styled.div`
	position: relative;
	height: 4px;
	background: #d8d8d8;

	&.loading {
		opacity: 0.7;
	}

	&.error {
		background: var(--secondary-red);
		opacity: 0.7;
	}

	&.dark {
		background: var(--primary-grey);
	}
`;

const Segment = styled.div`
	position: absolute;
	top: 0;
	bottom: 0;
	background: var(--secondary-green);
	max-width: 100%;
`;

const Milestones = styled.div`
	position: relative;
	margin-top: 0.625rem;
	height: 1.25rem;
`;

const Milestone = styled(Text.Base)`
	font-size: 0.875rem;
	display: block;
	position: absolute;
	top: 0;
	transform: translateX(-50%);
	color: var(--primary-grey);

	&.dark {
		color: white;
	}

	&:first-child {
		transform: none;
	}

	&:last-child {
		transform: translateX(-100%);
	}
`;

const BadgeContainer = styled.div`
	display: flex;
	margin-bottom: 20px;
	align-items: center;
`;

const CheckContainer = styled.div`
	color: var(--secondary-green);
	border: 1px var(--secondary-green) solid;
	border-radius: 50%;
	margin-right: 10px;
	font-size: 10px;
	width: 18px;
	height: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	align-content: center;
`;

const Badge = styled.div`
	color: var(--secondary-green);
	font-size: 10px;
	font-weight: bold;
	letter-spacing: 0;
	line-height: 14px;
	text-align: center;
	text-transform: uppercase;
`;

const getSegmentStyle = (seg, player, maxDuration) => ({
	...getTimeStyle(seg.video_start_time, player, maxDuration),
	...getDurationStyle(
		seg.video_end_time - seg.video_start_time + 1,
		player,
		maxDuration
	), //the segments are inclusive
});

const getSegmentProps = (seg, player, maxDuration) => ({
	'data-start': seg.video_start_time,
	'data-end': seg.video_end_time,
	style: getSegmentStyle(seg, player, maxDuration),
});

const useWatchedSegments = segments => {
	const player = usePlayer();
	const maxDuration = useDuration();

	const [liveSegments, setLiveSegments] = useState([]);
	const [videoCompleted, setVideoCompleted] = useState(false);

	const resolver = useResolver(async () => {
		if (segments) {
			return groupAdjoiningSegments(segments);
		}

		const video = player?.video;

		if (!video?.fetchLink) {
			return null;
		}

		setVideoCompleted(video.CompletedItem);

		const resp = await video.fetchLink('watched_segments');

		return groupAdjoiningSegments(resp.WatchedSegments);
	}, [player, player?.video, segments]);

	React.useEffect(() => {
		if (!player?.video) {
			return;
		}

		const listener = events => {
			const newSegments = events.reduce((acc, event) => {
				if (
					event.MimeType === VideoWatchType &&
					event.ResourceId === player?.video.getID?.()
				) {
					acc.push({
						video_start_time: event.video_start_time,
						video_end_time:
							event.video_end_time ??
							event.video_start_time + event.Duration,
						count: 1,
					});
				}

				return acc;
			}, []);

			setLiveSegments(
				groupAdjoiningSegments([...liveSegments, ...newSegments])
			);
		};

		AnalyticsHooks.addAfterBatchEventsListener(listener);

		return () => AnalyticsHooks.removeAfterBatchEventsListener(listener);
	}, [liveSegments, setLiveSegments, player?.video]);

	return {
		loading: isPending(resolver),
		error: isErrored(resolver) ? resolver : null,
		segments: isResolved(resolver)
			? groupAdjoiningSegments([...resolver, ...liveSegments]).map(s =>
					getSegmentProps(s, player, maxDuration)
			  )
			: null,
		videoCompleted,
	};
};

const useMileStones = () => {
	const player = usePlayer();
	const maxDuration = useDuration();

	return getMileStones(player, maxDuration).map(m => ({
		...m,
		style: getTimeStyle(m.time, player, maxDuration),
	}));
};

const useSeekHandler = onClick => {
	const player = usePlayer();
	const container = React.useRef();

	return {
		onClick: React.useCallback(
			e => {
				onClick?.(e);

				if (
					!e.defaultPrevented &&
					container.current &&
					player.getPlayerState
				) {
					const { duration } = player.getPlayerState();

					const rect = container.current.getBoundingClientRect();
					const relativeX = e.clientX - rect.left;

					const clickPercentage = relativeX / rect.width;
					const clickTime = Math.floor(duration * clickPercentage);

					player?.setCurrentTime?.(clickTime);
				}
			},
			[player, onClick]
		),
		ref: container,
	};
};

/**
 * Render the watched segments of the video in a trackbar
 *
 * @param {{segments:[Segment], onClick:(event:Event) => void, dark:boolean}} props
 * @returns {JSX.Element}
 */
export function WatchedSegments({
	segments: segmentsProp,
	onClick: onClickProp,
	dark,
	...otherProps
}) {
	const { loading, error, segments, videoCompleted } =
		useWatchedSegments(segmentsProp);
	const milestones = useMileStones();
	const { ref, onClick } = useSeekHandler(onClickProp);

	return (
		<Container {...otherProps} onClick={onClick} ref={ref}>
			{videoCompleted && (
				<BadgeContainer>
					<CheckContainer>
						<Icons.Check />
					</CheckContainer>
					<Badge>viewed</Badge>
				</BadgeContainer>
			)}
			<Bar loading={loading} error={error} dark={dark}>
				{(segments ?? []).map((seg, key) => (
					<Segment
						data-testid={`segment-${key}`}
						key={key}
						{...seg}
					/>
				))}
			</Bar>
			{milestones && (
				<Milestones>
					{milestones.map((milestone, key) => (
						<Milestone
							key={key}
							style={milestone.style}
							dark={dark}
						>
							{milestone.label}
						</Milestone>
					))}
				</Milestones>
			)}
		</Container>
	);
}

const TriggerIcon = styled(Icons.Chevron.Down)`
	border: 1px solid currentColor;
	border-radius: 50%;

	[aria-expanded='true'] & {
		transform: rotate(180deg);
	}
`;

WatchedSegments.Trigger = ({ children, ...props }) => (
	<Button {...props} data-testid="watched-segments-trigger">
		{React.Children.count(children) > 0 ? (
			children
		) : (
			<>
				<Text.Base>{t('trigger')}</Text.Base>
				<TriggerIcon />
			</>
		)}
	</Button>
);
