import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from '@nti/web-commons';
import cx from 'classnames';
import { scoped } from '@nti/lib-locale';

const DEFAULT_TEXT = {
	youtube: 'YouTube',
	vimeo: 'Vimeo',
	kaltura: 'Kaltura',
	wistia: 'Wistia'
};

const t = scoped('video.components.video-contents.video', DEFAULT_TEXT);

class Video extends Component {
	static propTypes = {
		video: PropTypes.shape({
			title: PropTypes.string,
			sources: PropTypes.array,
			NTIID: PropTypes.string,
		}).isRequired,
		onSelectChange: PropTypes.func.isRequired,
		isSelected: PropTypes.bool,
	}

	state = {
		thumbnail: ''
	}

	componentDidMount () {
		this.resolveThumbnail();
	}


	componentDidUpdate ({video}) {
		if (video !== this.props.video) {
			this.resolveThumbnail();
		}
	}


	async resolveThumbnail ({video} = this.props) {
		try {
			this.setState({ thumbnail: await video.getThumbnail() });
		} catch (e) {
			this.setState({ thumbnail: '', error: e });
		}
	}


	onSelectChange = () => {
		const { onSelectChange, video } = this.props;
		onSelectChange(video);
	}

	render () {
		const { isSelected, video } = this.props;
		const { title, sources } = video;
		const { thumbnail } = this.state;
		const sourceLabels = sources.map(source => (t(source.service) || '').toUpperCase());
		return (
			<div className={cx('video-resource-container', {'selection': isSelected})} onClick={this.onSelectChange}>
				<Checkbox checked={isSelected} name="video-item-checkbox" onChange={this.onSelectChange} />
				<div className="thumbnail" style={{backgroundImage: `url(${thumbnail})`}} />
				<div className="title">{title}</div>
				<div className="providers">
					{sourceLabels.map(label => <span key={label} className="provider">{label}</span>)}
				</div>
			</div>
		);
	}

}

export default Video;
