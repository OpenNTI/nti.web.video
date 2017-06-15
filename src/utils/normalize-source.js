export default function (service, source) {
	if (!/kaltura/i.test(service)) {
		return source;
	}

	const [providerId, entryId] = source.split('/');

	if (providerId && entryId) {
		return `${providerId}:${entryId}`;
	}

	return source;
}
