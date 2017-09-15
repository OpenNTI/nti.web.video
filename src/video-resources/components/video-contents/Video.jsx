import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'nti-web-commons';
import cx from 'classnames';

class Video extends Component {
	static propTypes = {
		video: PropTypes.shape({
			title: PropTypes.string,
			NTIID: PropTypes.string,
		}).isRequired,
		onSelectChange: PropTypes.func.isRequired,
		isSelected: PropTypes.bool.isRequired,
	}

	state = {
		thumbnail: ''
	}

	componentWillMount () {
		const { video } = this.props;
		video.getThumbnail()
			.then(thumbnail => {
				this.setState({
					thumbnail
				});
			});
	}

	componentWillReceiveProps (nextProps) {
		const { thumbnail: existingThumbnail } = this.state;
		const { video } = nextProps;
		if (existingThumbnail === '') {
			video.getThumbnail()
				.then(thumbnail => {
					this.setState({
						thumbnail
					});
				});
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
		const sourceLabels = sources.map(source => (source.server || '').toUpperCase());
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
