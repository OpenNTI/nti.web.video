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
		onSelectionChange: PropTypes.func.isRequired,
		isSelected: PropTypes.bool.isRequired,
		isSelection: PropTypes.bool.isRequired
	}

	state = {
		thumbnail: ''
	}

	async componentWillMount () {
		const { video } = this.props;
		const thumbnail = await video.getThumbnail();
		this.setState({
			thumbnail
		});
	}

	onSelectChange = () => {
		const { onSelectChange, video } = this.props;
		onSelectChange(video.NTIID);
	}

	onSelectionChange = () => {
		const { onSelectionChange, video } = this.props;
		onSelectionChange(video.NTIID);
	}

	render () {
		const { isSelected, isSelection, video } = this.props;
		const { title, sources } = video;
		const { thumbnail } = this.state;
		const sourceLabels = sources.map(source => (source.server || '').toUpperCase());
		return (
			<div className={cx('video-resource-container', {'selection': isSelection})} onClick={this.onSelectionChange} >
				<Checkbox checked={isSelected} name="video-item-checkbox" onChange={this.onSelectChange} />
				<div className="thumbnail" style={{backgroundImage: `url(${thumbnail})`}} />
				<div className="title">{title}</div>
				<div className="providers">
					{sourceLabels.map(label => (<span key={label} className="provider">{label}</span>))}
				</div>
			</div>
		);
	}

}

export default Video;
