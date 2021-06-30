export const reachedVideoEnd = (duration, resumeTime) => {
	const endMargin = duration * 0.02 <= 1 ? 1 : duration * 0.05
	return (duration - (resumeTime ?? 0)) <= endMargin;
};
