import React from 'react';
import PropTypes from 'prop-types';

import { Hooks, Text } from '@nti/web-commons';

import { usePlayer } from '../Context';

import getMileStones from './utils/get-mile-stones';
import { getTimeStyle, getDurationStyle } from './utils/get-styles';
import groupAdjoiningSegments from './utils/group-adjoining-segments';

const { useResolver } = Hooks;
const { isPending, isErrored, isResolved } = useResolver;

const Container = styled.div`
	cursor: pointer;
`;

const Bar = styled.div`
	position: relative;
	height: 4px;
	background: #d8d8d8;
`;

const Segment = styled.div`
	position: absolute;
	top: 0;
	bottom: 0;
	background: var(--secondary-green);
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

	&:first-child {
		transform: none;
	}

	&:last-child {
		transform: translateX(-100%);
	}
`;

const getSegmentStyle = (seg, player) => ({
	...getTimeStyle(seg.video_start_time, player),
	...getDurationStyle(seg.video_end_time - seg.video_start_time, player),
});

const getSegmentProps = (seg, player) => ({
	'data-start': seg.video_start_time,
	'data-end': seg.video_end_time,
	style: getSegmentStyle(seg, player),
});

const useWatchedSegments = segments => {
	const player = usePlayer();

	const resolver = useResolver(async () => {
		const toProps = s => getSegmentProps(s, player);

		if (segments) {
			return groupAdjoiningSegments(segments).map(toProps);
		}

		const video = player?.video;

		if (!video?.fetchLink) {
			return null;
		}

		const resp = await video.fetchLink('watched_segments');

		return groupAdjoiningSegments(resp.WatchedSegments).map(toProps);
	}, [player, segments]);

	return {
		loading: isPending(resolver),
		error: isErrored(resolver) ? resolver : null,
		segments: isResolved(resolver) ? resolver : null,
	};
};

const useMileStones = () => {
	const player = usePlayer();

	return getMileStones(player).map(m => ({
		...m,
		style: getTimeStyle(m.time, player),
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

export function WatchedSegments({
	segments: segmentsProp,
	onClick: onClickProp,
	...otherProps
}) {
	const milestones = useMileStones();
	const { loading, error, segments } = useWatchedSegments(segmentsProp);
	const { ref, onClick } = useSeekHandler(onClickProp);

	return (
		<Container {...otherProps} onClick={onClick} ref={ref}>
			<Bar loading={loading} error={error}>
				{(segments ?? []).map((seg, key) => (
					<Segment key={key} {...seg} />
				))}
			</Bar>
			{milestones && (
				<Milestones>
					{milestones.map((milestone, key) => (
						<Milestone key={key} style={milestone.style}>
							{milestone.label}
						</Milestone>
					))}
				</Milestones>
			)}
		</Container>
	);
}

WatchedSegments.propTypes = {
	segments: PropTypes.arrayOf([
		PropTypes.shape({
			video_start_time: PropTypes.number,
			video_end_time: PropTypes.number,
		}),
	]),
	onClick: PropTypes.func,
};
