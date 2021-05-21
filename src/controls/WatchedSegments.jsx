import React from 'react';
import PropTypes from 'prop-types';

import { Hooks, Loading } from '@nti/web-commons';

import { usePlayer } from '../Context';

import groupAdjoiningSegments from './utils/group-adjoining-segments';

const { useResolver } = Hooks;
const { isPending, isErrored, isResolved } = useResolver;

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

const getSegmentStyle = (seg, player) => {
	if (!player?.getPlayerState) {
		return null;
	}

	const { duration } = player.getPlayerState();
	const length = seg.video_end_time - seg.video_start_time;

	return {
		left: `${Math.floor((seg.video_start_time / duration) * 100)}%`,
		width: `${Math.ceil((length / duration) * 100)}%`,
	};
};

export function WatchedSegments({ segments: segmentsProp, ...otherProps }) {
	const player = usePlayer();

	const resolver = useResolver(async () => {
		if (segmentsProp) {
			return segmentsProp;
		}

		const video = player?.video;

		if (!video?.fetchLink) {
			return null;
		}

		const resp = await video.fetchLink('watched_segments');

		return groupAdjoiningSegments(resp.WatchedSegments);
	}, [player, segmentsProp]);

	const loading = isPending(resolver);
	const error = isErrored(resolver) ? resolver : null;
	const segments = isResolved(resolver) ? resolver : null;

	return (
		<div {...otherProps}>
			<Bar loading={loading} error={error}>
				{(segments ?? []).map((seg, key) => (
					<Segment key={key} style={getSegmentStyle(seg, player)} />
				))}
			</Bar>
		</div>
	);
}

WatchedSegments.propTypes = {
	segments: PropTypes.arrayOf([
		PropTypes.shape({
			video_start_time: PropTypes.number,
			video_end_time: PropTypes.number,
		}),
	]),
};
