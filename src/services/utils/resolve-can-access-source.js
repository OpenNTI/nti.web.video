export default function resolveCanAccessSource(source) {
	let resolve;

	if (!source) {
		resolve = Promise.resolve(false);
	} else if (!source.resolveCanAccess) {
		resolve = Promise.resolve(true);
	} else {
		resolve = source.resolveCanAccess();
	}

	return resolve;
}
