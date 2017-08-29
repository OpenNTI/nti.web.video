import React from 'react';
import PropTypes from 'prop-types';
import {getService} from 'nti-web-client';
import {getModel} from 'nti-lib-interfaces';

import {createMediaSourceFromUrl, getCanonicalUrlFrom} from '../../services';
import Editor, { EmbedInput } from '../../editor';

const SourceMimeType = 'application/vnd.nextthought.ntivideosource';
const Types = {
	'kaltura': 'video/kaltura',
	'youtube': 'video/youtube',
	'vimeo': 'video/vimeo'
};
const VideoModel = getModel('video');

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
			MimeType: VideoModel.getMimeType(),
			title,
			sources
		};
	});
}

function onNewVideoSave (source) {
	const { bundle } = this.props;
	const link = bundle.getLink('assets');

	createMediaSourceFromUrl(getCanonicalUrlFrom(source))
		.then(media => createVideoJSON(media))
		.then((video) => getService().then((service) => service.postParseResponse(link, video)))
		.then((video) => this.setState({ video }));
}

const EditVideo = ({ onSave, onCancel, video }) => (
	<div className="edit-video">
		{!video && <EmbedInput onSave={onNewVideoSave} onCancel={onCancel} />}
		{video && <Editor video={video} onSave={onSave} onCancel={onCancel} />}
	</div>
);

EditVideo.propTypes = {
	video: PropTypes.object,
	onCancel: PropTypes.func,
	onSave: PropTypes.func.isRequired,
};

export default EditVideo;
