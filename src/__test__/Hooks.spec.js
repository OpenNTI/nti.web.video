/* eslint-env jest */
import { renderHook } from '@testing-library/react-hooks';

import { setupTestClient } from '@nti/web-client/test-utils';

import { useVideoCompletion } from '../Context';

beforeEach(() => {
	setupTestClient({});
});

test('useVideoCompletion Hook.', () => {
	const { result } = renderHook(() => useVideoCompletion());

	expect(result.current).toBe(false);
});
