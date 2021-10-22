/** @typedef {number} Time - video timestamp in seconds */
/** @typedef {{video_start_time:Time, video_end_time: Time}} Segment */

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import {
	Hooks as AnalyticsHooks,
	Manager as AnalyticManager,
} from '@nti/lib-analytics';
import { scoped } from '@nti/lib-locale';
import { Hooks, Text, Loading, Placeholder } from '@nti/web-commons';
import { Button, Icons } from '@nti/web-core';

import { usePlayer, useDuration } from '../Context';

import getMileStones from './utils/get-mile-stones';
import { getTimeStyle, getDurationStyle } from './utils/get-styles';
import { groupAdjoiningSegments, getVisibleSegments } from './utils/segments';

const { useResolver } = Hooks;
const { isPending, isErrored, isResolved } = useResolver;

const VideoWatchType = AnalyticManager.getTypeForEvent('VideoWatch');

const t = scoped('nti-video.controls.WatchedSegments', {
	trigger: 'Watch History',
	viewed: 'viewed',
	alert: 'Incomplete — Watch more to complete this video.',
});

const Translate = Text.Translator(t);

//#region 🎨
const styles = stylesheet`
	.fade-up {
		animation: fade-up 0.5s;
		animation-iteration-count: 1;
		animation-fill-mode: both;
	}

	@keyframes fade-up {
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}
`;

const Container = styled.div`
	cursor: pointer;
	min-height: 34px;
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

const SharedIconStyle = styled.i`
	margin-right: 10px;
	width: 18px;
	height: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	align-content: center;
	font-size: 10px;
`;

const Check = styled(SharedIconStyle).attrs({ as: Icons.Check })`
	color: var(--secondary-green);
	border: 1px var(--secondary-green) solid;
	border-radius: 50%;
`;

const Alert = styled(SharedIconStyle).attrs({ as: Icons.Alert })`
	color: var(--primary-red);
	font-size: 18px;
`;

const Badge = styled.div`
	color: var(--secondary-green);
	font-size: 10px;
	font-weight: bold;
	letter-spacing: 0;
	line-height: 14px;
	text-align: center;
	text-transform: uppercase;

	&.alert {
		color: var(--primary-red);
	}
`;
//#endregion

//#region 🛠️

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

const useWatchedSegments = (segmentsProp, bar) => {
	const player = usePlayer();
	const maxDuration = useDuration();

	const [liveSegments, setLiveSegments] = useState([]);

	const resolver = useResolver(async () => {
		if (segmentsProp) {
			return groupAdjoiningSegments(segmentsProp);
		}

		const video = player?.video;

		if (!video?.fetchLink) {
			return null;
		}

		const resp = await video.fetchLink({
			mode: 'raw',
			rel: 'watched_segments',
		});

		return {
			segments: groupAdjoiningSegments(resp.WatchedSegments),
			maxDuration: resp.MaxDuration,
		};
	}, [player, player?.video, segmentsProp]);

	useEffect(() => {
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

	const segments = useMemo(() => {
		if (!bar || !isResolved(resolver)) {
			return null;
		}

		const { segments: analyticsSegments, maxDuration: analyticsDuration } =
			resolver;

		const duration =
			maxDuration ??
			analyticsDuration ??
			player?.getPlayerState?.()?.duration;

		return getVisibleSegments(
			groupAdjoiningSegments([...analyticsSegments, ...liveSegments]),
			duration,
			bar?.offsetWidth
		).map(s => getSegmentProps(s, player, duration));
	}, [resolver, liveSegments, maxDuration, bar, player]);

	return {
		loading: isPending(resolver),
		error: isErrored(resolver) ? resolver : null,
		maxDuration:
			maxDuration ??
			(isResolved(resolver) ? resolver.maxDuration : null) ??
			player?.getPlayerState?.()?.duration,
		segments,
	};
};

const useMileStones = maxDuration => {
	const player = usePlayer();

	return getMileStones(player, maxDuration).map(m => ({
		...m,
		style: getTimeStyle(m.time, player, maxDuration),
	}));
};

const useSeekHandler = onClick => {
	const player = usePlayer();
	const container = useRef();

	return {
		onClick: useCallback(
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

//#endregion

/**
 * Render the watched segments of the video in a track bar
 *
 * @param {Object} props
 * @param {Segment[]} props.segments
 * @param {(event:Event) => void} props.onClick
 * @param {boolean} props.dark
 * @param {boolean} props.alert
 * @param {boolean} props.viewed
 * @returns {JSX.Element}
 */
export function WatchedSegments({
	segments: segmentsProp,
	onClick: onClickProp,
	dark,
	alert,
	viewed,
	...otherProps
}) {
	const [bar, setBar] = useState(null);
	const BarRef = useCallback(
		newBar => {
			if (bar !== newBar) {
				setBar(newBar);
			}
		},
		[setBar, bar]
	);

	const { loading, error, segments, maxDuration } = useWatchedSegments(
		segmentsProp,
		bar
	);
	const milestones = useMileStones(maxDuration);
	const { ref, onClick } = useSeekHandler(onClickProp);

	const CompletionIcon = alert ? Alert : Check;

	return (
		<Container {...otherProps} onClick={onClick} ref={ref}>
			<Loading.Placeholder
				loading={loading}
				fallback={<Placeholder.Text text="Loading..." />}
			>
				<div className={styles.fadeUp}>
					{(alert || viewed) && (
						<BadgeContainer>
							<CompletionIcon />
							<Badge alert={alert}>
								<Translate
									localeKey={alert ? 'alert' : 'viewed'}
								/>
							</Badge>
						</BadgeContainer>
					)}
					<Bar
						data-testid="watched-segments-bar"
						ref={BarRef}
						loading={loading}
						error={error}
						dark={dark}
					>
						{(segments ?? []).map((seg, key) => (
							<Segment key={key} {...seg} />
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
				</div>
			</Loading.Placeholder>
		</Container>
	);
}

const TriggerButton = styled(Button)`
	&.alert {
		background-color: rgba(var(--primary-red-rgb), 0.15) !important;
	}
`;

const TriggerIcon = styled(Icons.Chevron.Down)`
	border: 1px solid currentColor;
	border-radius: 50%;

	[aria-expanded='true'] & {
		transform: rotate(180deg);
	}

	&.alert {
		border-color: var(--primary-red);
	}
`;

const ContentContainer = styled.div`
	&.alert {
		color: var(--primary-red);
	}

	& > * {
		vertical-align: middle;
	}
`;

WatchedSegments.Trigger = ({ alert, children, ...props }) => (
	<TriggerButton
		alert={alert}
		{...props}
		data-testid="watched-segments-trigger"
	>
		{React.Children.count(children) > 0 ? (
			children
		) : (
			<ContentContainer alert={alert}>
				<Text.Base>
					<Translate localeKey="trigger" />
				</Text.Base>
				<TriggerIcon alert={alert} />
			</ContentContainer>
		)}
	</TriggerButton>
);
