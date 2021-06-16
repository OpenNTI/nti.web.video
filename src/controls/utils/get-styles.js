export const getTimeStyle = (time, player, maxDuration) => {
	const state = player?.getPlayerState?.() ?? {};
	const videoDuration = maxDuration ?? state.duration;

	if (videoDuration == null) {
		return {};
	}

	return {
		left: `${Math.floor((time / videoDuration) * 100)}%`,
	};
};

export const getDurationStyle = (segmentDuration, player, maxDuration) => {
	const state = player?.getPlayerState?.() ?? {};
	const videoDuration = maxDuration ?? state.duration;

	if (videoDuration == null) {
		return {};
	}

	return {
		width: `${Math.ceil((segmentDuration / videoDuration) * 100)}%`,
	};
};
