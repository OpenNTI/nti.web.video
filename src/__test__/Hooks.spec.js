/* eslint-env jest */
import { renderHook } from '@testing-library/react-hooks';

import * as Commons from '@nti/web-commons';

import * as Context from '../Context';
import useVideoCompletion from '../hooks/use-video-completion';
import useWatchedTilEnd from '../hooks/use-watched-til-end';

jest.mock('@nti/web-commons');

beforeEach(() => {
	Commons.useResolver.mockImplementation(fn => fn());
	Commons.useResolver.isResolved.mockImplementation(() => true);
});

test('useVideoCompletion Hook.', () => {
	jest.spyOn(Context, 'usePlayer').mockImplementation(() => {
		return {
			video: {
				isCompletable: () => true,
				hasCompleted: () => false,
			},
		};
	});

	const { result } = renderHook(() => useVideoCompletion());

	expect(result.current).toBe(false);
});

test('useWatchedTilEnd Hook.', () => {
	jest.spyOn(Context, 'useDuration').mockImplementation(() => 60);

	const segmentsFalse = [{ 'data-end': 1 }];

	const { result: first } = renderHook(() => useWatchedTilEnd(segmentsFalse));

	expect(first.current).toBe(false);

	const segmentsTrue = [{ 'data-end': 59 }];

	const { result: second } = renderHook(() => useWatchedTilEnd(segmentsTrue));

	expect(second.current).toBe(true);
});
