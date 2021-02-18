import './EditVideo.scss';
import React from 'react';
import PropTypes from 'prop-types';
import { getService } from '@nti/web-client';
import { Models } from '@nti/lib-interfaces';

import { createMediaSourceFromUrl, getCanonicalUrlFrom } from '../../services';
import Editor, { EmbedInput } from '../../editor';

const SourceMimeType = 'application/vnd.nextthought.ntivideosource';
const Types = {
	kaltura: 'video/kaltura',
	youtube: 'video/youtube',
	vimeo: 'video/vimeo',
	wistia: 'video/wistia',
};

function createSources({ service, source }) {
	return [
		{
			MimeType: SourceMimeType,
			service,
			source: [source],
			type: [Types[service]],
		},
	];
}

function createVideoJSON(media) {
	return Promise.all([createSources(media), media.getTitle()]).then(
		([sources, title]) => {
			return {
				MimeType: Models.media.Video.MimeType,
				title,
				sources,
			};
		}
	);
}

export default class EditVideo extends React.Component {
	static propTypes = {
		video: PropTypes.object,
		onCancel: PropTypes.func,
		onSave: PropTypes.func.isRequired,
		course: PropTypes.shape({
			getLink: PropTypes.func.isRequired,
			hasLink: PropTypes.func.isRequired,
		}).isRequired,
		onCreate: PropTypes.func.isRequired,
		onVideoDelete: PropTypes.func.isRequired,
	};

	onNewVideoSave = async source => {
		const { course, onCreate } = this.props;
		const link = course.getLink('assets');
		const media = await createMediaSourceFromUrl(
			getCanonicalUrlFrom(source)
		);
		const videoJSON = await createVideoJSON(media);
		const service = await getService();
		const createdVideo = await service.postParseResponse(link, videoJSON);
		onCreate(createdVideo);
	};

	render() {
		const { onSave, onCancel, video, onVideoDelete } = this.props;

		const editClass = !video ? 'embed' : 'editor';
		return (
			<div className={`edit-video video-resources-edit-${editClass}`}>
				{!video ? (
					<EmbedInput
						onSelect={this.onNewVideoSave}
						onCancel={onCancel}
					/>
				) : (
					<Editor
						video={video}
						onSave={onSave}
						onCancel={onCancel}
						onVideoDelete={onVideoDelete}
					/>
				)}
			</div>
		);
	}
}
