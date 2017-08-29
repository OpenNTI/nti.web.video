import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Panels, Search, Button }  from 'nti-web-commons';

import VideoContents from './video-contents/VideoContents';
import EditVideo from './EditVideo';

const { Header, HeaderSpacer, Toolbar, ToolbarSpacer, ToolbarButton } = Panels;

class Browser extends Component {
	static propTypes = {
		onClose: PropTypes.func,
		onEdit: PropTypes.func.isRequired,
		videos: PropTypes.array,
		setEditing: PropTypes.func,
	}

	constructor (props) {
		super(props);
		this.state = {
			search: '',
			videoContents: [...props.videos],
			videos: [...props.videos],
			selection: null,
			selected: null,
			video: null,
			isEditing: false
		};
	}

	componentWillReceiveProps (nextProps) {
		const { videos } = nextProps;
		const { search } = this.state;
		this.setState({
			videos,
			videoContents: search === '' ? videos : videos.filter(video => this.itemMatchesSearch(video, search))
		});
	}

	onSearch = (search) => {
		const { videos } = this.state;
		this.setState({
			videoContents: videos.filter(video => this.itemMatchesSearch(video, search)),
			search
		});
	}

	onDelete () {}

	onSelectChange = (selected) => {
		const { selected: oldSelected } = this.state;
		this.setState({
			selected: oldSelected === selected ? null : selected,
			selection: oldSelected === selected ? null : selected
		});
	}

	// There will be multiple selection eventually for video-rolls. Right now it's dumb and thinks there can only be one.
	onSelectionChange = (selection) => {
		const { selection: oldSelection } = this.state;
		this.setState({
			selection: oldSelection === selection ? null : selection,
			selected: oldSelection === selection ? null : selection
		});
	}

	itemMatchesSearch (video, searchTerm) {
		const title = video.title || video.get('title');
		const ntiid = video.NTIID || video.getId();
		const sources = video.sources || video.get('sources');
		let matches = false;

		searchTerm = searchTerm.toLowerCase();

		if (title && title.toLowerCase().includes(searchTerm)) {
			matches = true;
		} else if (ntiid && ntiid.toLowerCase() === searchTerm) {
			matches = true;
		} else if (sources && sources.length) {
			matches = sources.reduce((acc, source) => {
				let provider = source.service;
				return provider.toLowerCase() === searchTerm;
			}, false);
		}

		return matches;
	}

	onEditClick = ({ target: { name }}) => {
		const { selected } = this.state;
		const { videos, setEditing } = this.props;
		setEditing(true);
		this.setState({
			video: name === 'create' ? null : videos.find(v => v.getID() === selected),
			isEditing: true
		});
	}

	onEditCancel = () => {
		const { setEditing } = this.props;
		setEditing(false);
		this.setState({
			video: null,
			isEditing: false
		});
	}

	onEditSave = (video) => {
		const { onEdit } = this.props;
		onEdit(video);
		this.setState({
			video: null,
			isEditing: false
		});
	}

	render () {
		const { onClose } = this.props;
		const { search, selection, selected, videoContents, isEditing, video } = this.state;

		return (
			<div className="video-resource-browser">
				<Header onClose={onClose}>
					<div className="title-row">
						<HeaderSpacer />
						<span className="video-header-name">Pick A Video</span>
						<HeaderSpacer />
					</div>
					<Toolbar>
						{!isEditing && <Button className="create-video-button" rounded name="create" onClick={this.onEditClick}>Create Video</Button>}
						{isEditing && <Button className="back-button" rounded name="back" onClick={this.onEditCancel}>Back to Videos</Button>}
						<ToolbarButton
							icon="edit"
							label="Edit"
							name="edit"
							onClick={this.onEditClick}
							available={!!selection && !isEditing}
						/>
						<ToolbarButton
							icon="delete"
							label="Delete"
							onClick={this.onDelete}
							available={(!!selection && !isEditing) || (isEditing && video === null)}
						/>
						<ToolbarSpacer />
						<Search
							value={search}
							onChange={this.onSearch}
							buffered={false}
						/>
					</Toolbar>
				</Header>
				{!isEditing && (
					<VideoContents
						videos={videoContents}
						selection={selection}
						selected={selected}
						onSelectionChange={this.onSelectionChange}
						onSelectChange={this.onSelectChange}
					/>
				)}
				{isEditing && <EditVideo video={video} onSave={this.onEditSave} onCancel={this.onEditCancel} />}
			</div>
		);
	}
}

export default Browser;
