/* eslint-env jest */
import { renderHook } from '@testing-library/react-hooks';

import * as Commons from '@nti/web-commons';

import * as Context from '../Context';
import useVideoCompletion from '../hooks/use-video-completion';
import { ENDED } from '../Constants';

jest.mock('@nti/web-commons');

beforeEach(() => {
	Commons.useResolver.mockImplementation(fn => fn());
	Commons.useResolver.isResolved.mockImplementation(() => true);
});

test('useVideoCompletion Hook.', async () => {
	const refresh = jest.fn();

	jest.spyOn(Context, 'useDuration').mockImplementation(() => 100);
	jest.spyOn(Context, 'usePlayer').mockImplementation(() => ({
		getPlayerState: () => ({ state: ENDED }),
		video: {
			isCompletable: () => true,
			hasCompleted: () => true,
			completedSuccessfully: () => true,
			refresh: refresh,
		},
	}));
	jest.spyOn(Context, 'useCurrentTime').mockImplementation(() => 90);

	const hook = renderHook(() => useVideoCompletion());

	hook.waitForNextUpdate();

	const completion = await hook.result.current;

	expect(refresh).toBeCalled();
	expect(completion).toEqual({
		watchedTilEnd: true,
		videoCompletable: true,
		videoCompleted: true,
	});
});
