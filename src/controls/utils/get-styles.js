export const getTimeStyle = (time, player) => {
	const { duration } = player?.getPlayerState?.() ?? {};

	if (duration == null) {
		return {};
	}

	return {
		left: `${Math.floor((time / duration) * 100)}%`,
	};
};

export const getDurationStyle = (segmentDuration, player) => {
	const { duration: videoDuration } = player?.getPlayerState?.() ?? {};

	if (videoDuration == null) {
		return {};
	}

	return {
		width: `${Math.ceil((segmentDuration / videoDuration) * 100)}%`,
	};
};
