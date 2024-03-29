import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

const DEFAULT = 'default';

const isIE = /(Trident|Edge)\//.test((global.navigator || {}).userAgent);

export default class VideoMoreControlQuality extends React.Component {
	static shouldShow(videoState) {
		const { sourceGroups } = videoState || {};

		// for now, we will disable this on IE because there is an issue trying
		// to dynamically change sources specifically on IE videos
		return !isIE && sourceGroups && sourceGroups.length > 1;
	}

	static getFormattedActiveQuality(videoState) {
		return (videoState || {}).activeSourceGroup || 'auto';
	}

	static propTypes = {
		videoState: PropTypes.shape({
			sourceGroups: PropTypes.array,
			activeSourceGroup: PropTypes.string,
		}),
		selectSourceGroup: PropTypes.func,
	};

	handlers = {};

	get sourceGroups() {
		const { videoState } = this.props;
		const { sourceGroups } = videoState || {};

		return sourceGroups || [];
	}

	get activeSourceGroup() {
		const { videoState } = this.props;
		const { activeSourceGroup } = videoState || {};

		return activeSourceGroup;
	}

	selectSourceGroup = (group, e) => {
		e.stopPropagation();
		e.preventDefault();

		const { selectSourceGroup } = this.props;

		if (selectSourceGroup) {
			selectSourceGroup(group);
		}
	};

	render() {
		const { sourceGroups, activeSourceGroup } = this;

		return (
			<ul className="video-more-control-quality">
				{sourceGroups
					.filter(group => group.name !== DEFAULT)
					.map((sourceGroup, index) => {
						const { name } = sourceGroup;
						const selected = sourceGroup.name === activeSourceGroup;
						const handler =
							this.handlers[name] ||
							(e => this.selectSourceGroup(sourceGroup, e));

						this.handlers[name] = handler;

						return (
							<li
								key={index}
								className={cx({ selected })}
								onClick={handler}
							>
								{selected && <i className="icon-check" />}
								<span className="quality-label">{name}</span>
							</li>
						);
					})}
			</ul>
		);
	}
}
