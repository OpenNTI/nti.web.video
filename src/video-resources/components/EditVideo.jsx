import React from 'react';
import PropTypes from 'prop-types';
import {getService} from 'nti-web-client';
import {Models} from 'nti-lib-interfaces';

import {createMediaSourceFromUrl, getCanonicalUrlFrom} from '../../services';
import Editor, { EmbedInput } from '../../editor';

const SourceMimeType = 'application/vnd.nextthought.ntivideosource';
const Types = {
	'kaltura': 'video/kaltura',
	'youtube': 'video/youtube',
	'vimeo': 'video/vimeo'
};

function createSources ({service, source}) {
	return [{
		MimeType: SourceMimeType,
		service,
		source: [source],
		type: [Types[service]]
	}];
}

function createVideoJSON (media) {
	return Promise.all([
		createSources(media),
		media.getTitle()
	]).then(([sources, title]) => {
		return {
			MimeType: Models.media.Video.MimeType[0],
			title,
			sources
		};
	});
}

const EditVideo = ({ onSave, onCancel, video, course, onCreate, onVideoDelete }) => {

	const onNewVideoSave = async function (source) {
		const link = course.getLink('assets');
		const media = await createMediaSourceFromUrl(getCanonicalUrlFrom(source));
		const videoJSON = await createVideoJSON(media);
		const service = await getService();
		const createdVideo = await service.postParseResponse(link, videoJSON);
		onCreate(createdVideo);
	};

	const editClass = !video ? 'embed' : 'editor';
	return (
		<div className={`edit-video video-resources-edit-${editClass}`}>
			{ !video
				? <EmbedInput onSelect={onNewVideoSave} onCancel={onCancel} />
				: <Editor video={video} onSave={onSave} onCancel={onCancel} onVideoDelete={onVideoDelete} />
			}
		</div>
	);
};

EditVideo.propTypes = {
	video: PropTypes.object,
	onCancel: PropTypes.func,
	onSave: PropTypes.func.isRequired,
	course: PropTypes.shape({
		hasLink: PropTypes.func.isRequired,
	}).isRequired,
	onCreate: PropTypes.func.isRequired,
	onVideoDelete: PropTypes.func.isRequired,
};

export default EditVideo;
