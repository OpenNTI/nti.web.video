import {getService} from '@nti/web-client';

export default async function resolveVideo (video) {
	if (typeof video !== 'string') { return video; }

	const service = await getService();

	return service.getObject(video);
}
