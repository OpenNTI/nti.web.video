/** @typedef {number} Time - Video timestamp (in seconds) */
/** @typedef {string} TimeLabel - HH:MM:SS or MM:SS */
/** @typedef {{time:Time, label: TimeLabel}} Milestone */

const getMileStoneLabel = m => {
	const hours = Math.floor(m / 3600);
	const remaining = m - hours * 3600;

	const minutes = Math.floor(remaining / 60);
	const seconds = Math.floor(remaining) % 60;

	const secondsString = `${seconds}`.padStart(2, '0');
	const minutesString = `${minutes}`.padStart(2, '0');

	return hours <= 0
		? `${minutesString}:${secondsString}`
		: `${hours}:${minutesString}:${secondsString}`;
};

/**
 *
 * @param {object} player
 * @param maxDuration
 * @returns {[Milestone]}
 */
export default function getMileStones(player, maxDuration) {
	const state = player?.getPlayerState?.() ?? {};
	const videoDuration = maxDuration ?? state.duration;

	if (!videoDuration) {
		return [];
	}

	return [
		0,
		videoDuration * 0.25,
		videoDuration * 0.5,
		videoDuration * 0.75,
		videoDuration,
	].map(m => ({
		time: m,
		label: getMileStoneLabel(m),
	}));
}
