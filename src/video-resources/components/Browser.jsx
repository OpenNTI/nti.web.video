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
		course: PropTypes.shape({
			getLink: PropTypes.func.isRequired,
		}).isRequired,
		videos: PropTypes.array,
		setEditing: PropTypes.func,
		onDelete: PropTypes.func.isRequired,
		onSelect: PropTypes.func.isRequired,
	}

	constructor (props) {
		super(props);

		const {videos} = props;

		this.state = {
			search: '',
			videoContents: videos ? [...props.videos] : null,
			videos: videos ? [...props.videos] : null,
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

	onDelete = () => {
		const { selected } = this.state;
		const { onDelete } = this.props;
		onDelete(selected);
		this.setState({ selected: false });
	}

	onVideoDelete = (videoId) => {
		const { onDelete } = this.props;
		onDelete(videoId);
		this.setState({ selected: false });
	}

	onSelectChange = (selected) => {
		const { selected: oldSelected } = this.state;
		const { onSelect } = this.props;
		this.setState({
			selected: oldSelected && oldSelected.getID() === selected.getID() ? false : selected,
		}, () => {
			const { selected: currerntSelected } = this.state;
			onSelect(currerntSelected);
		});
	}

	itemMatchesSearch (video, searchTerm) {
		const title = video.title || '';
		const ntiid = video.NTIID || '';
		const sources = video.sources || [];
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
			video: name === 'create' ? null : videos.find(v => v.getID() === selected.getID()),
			isEditing: true
		});
	}

	onEditCancel = () => {
		const { setEditing } = this.props;
		this.setState({
			video: null,
			isEditing: false
		}, () => {
			setEditing(false);
		});
	}

	onEditSave = (video) => {
		const { onEdit } = this.props;

		this.setState({
			video: null,
			isEditing: false
		}, () => {
			onEdit(video);
		});
	}

	onCreate = (video) => {
		this.setState({
			video,
			selected: video
		});
	}

	render () {
		const { onClose, course } = this.props;
		const { search, selected, videoContents, isEditing, video } = this.state;
		return (
			<div className="video-resource-browser">
				<Header onClose={onClose}>
					<div className="title-row">
						<HeaderSpacer />
						<span className="video-header-name">Pick A Video</span>
						<HeaderSpacer />
					</div>
					<Toolbar>
						{	!isEditing
							? <Button className="create-video-button" rounded name="create" onClick={this.onEditClick}>Create Video</Button>
							:	<Button className="back-button" rounded name="back" onClick={this.onEditCancel}>Back to Videos</Button>
						}
						<ToolbarButton
							icon="edit"
							label="Edit"
							name="edit"
							onClick={this.onEditClick}
							available={selected && selected.hasLink('edit') && !isEditing}
						/>
						<ToolbarButton
							icon="delete"
							label="Delete"
							onClick={this.onDelete}
							available={selected && selected.hasLink('delete') && !isEditing}
						/>
						<ToolbarSpacer />
						<Search
							value={search}
							onChange={this.onSearch}
							buffered={false}
						/>
					</Toolbar>
				</Header>
				{!isEditing ? (
					<VideoContents
						videos={videoContents}
						selected={selected}
						onSelectChange={this.onSelectChange}
					/>
				) : (
					<EditVideo
						video={video}
						course={course}
						onCreate={this.onCreate}
						onSave={this.onEditSave}
						onCancel={this.onEditCancel}
						onVideoDelete={this.onVideoDelete}
					/>
				)}
			</div>
		);
	}
}

export default Browser;
