export default function removeSourceFromGroups (groups, erroredSources) {
	const newGroups = groups.map(group => {
		return {
			...group,
			sources: group.sources.filter(src => !erroredSources[src.src])
		};
	});

	let filteredGroups = [];
	let preferredIndex = -1;
	let lockPreferred = false;

	for (let i = 0; i < newGroups.length; i++) {
		let group = newGroups[i];
		let isEmpty = group.sources.length === 0;


		if (!isEmpty) {
			filteredGroups.push({...group, preferred: false});

			if (!lockPreferred) {
				preferredIndex = filteredGroups.length - 1;
			}
		}

		if (group.preferred) {
			lockPreferred = true;
		}
	}

	if (filteredGroups[preferredIndex]) {
		filteredGroups[preferredIndex].preferred = true;
	} else if (filteredGroups[0]) {
		filteredGroups[0].preferred = true;
	}

	return filteredGroups;
}
