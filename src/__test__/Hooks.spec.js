/* eslint-env jest */
import { renderHook } from '@testing-library/react-hooks';

import * as Commons from '@nti/web-commons';

import * as Context from '../Context';
import useVideoCompletion from '../hooks/use-video-completion';

jest.mock('@nti/web-commons');

beforeEach(() => {
	Commons.useResolver.mockImplementation(fn => fn());
	Commons.useResolver.isResolved.mockImplementation(() => true);

	jest.spyOn(Context, 'useDuration').mockImplementation(() => 60);
});

test('useVideoCompletion Hook.', () => {
	const refresh = jest.fn();

	jest.spyOn(Context, 'usePlayer').mockImplementation(() => {
		return {
			video: {
				isCompletable: () => true,
				hasCompleted: () => false,
				refresh: refresh,
			},
		};
	});

	const segments = [{ 'data-end': 1, 'data-start': 0 }];

	renderHook(() => useVideoCompletion(segments));

	expect(refresh).toBeCalled();
});
