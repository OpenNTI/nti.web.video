import React from 'react';
import PropTypes from 'prop-types';
import {scoped} from 'nti-lib-locale';

import { areTranscriptsValid } from './utils/TranscriptUtils';
import TranscriptItem from './TranscriptItem';

const DEFAULT_TEXT = {
	captions: 'Transcript File (Optional)',
	errors: {
		update: 'Could not update transcript',
		fileType: 'Selected file must be a .vtt file',
		general: 'Unable to edit transcripts'
	}
};

const t = scoped('nti-video.editor.Transcripts', DEFAULT_TEXT);

const AVAILABLE_LANGS = ['en'];
const AVAILABLE_PURPOSES = ['normal', 'captions'];

export default class Transcripts extends React.Component {
	static propTypes = {
		video: PropTypes.object.isRequired,
		transcripts: PropTypes.arrayOf(PropTypes.object),
		transcriptAdded: PropTypes.func,
		transcriptRemoved: PropTypes.func,
		transcriptUpdated: PropTypes.func,
		transcriptReplaced: PropTypes.func,
		onError: PropTypes.func
	}

	constructor (props) {
		super(props);
	}

	attachAddLinkRef = x => this.addLink = x

	onError = (defaultMsg, response) => {
		if(this.props.onError) {
			if (response && response.responseText) {
				this.props.onError(JSON.parse(response.responseText).message);
			} else if (response && response.message) {
				this.props.onError(response.message);
			} else {
				this.props.onError(defaultMsg);
			}
		}
	};

	clearError = () => {
		if(this.props.onError) {
			this.props.onError();
		}
	}

	renderAddTranscriptWidget () {
		const { video, transcripts, transcriptAdded } = this.props;

		let usedLanguages = new Set();
		let usedPurposes = new Set();

		transcripts.forEach((trn) => {
			usedLanguages.add(trn.lang.toLowerCase());
			usedPurposes.add(trn.purpose.toLowerCase());
		});

		if(usedLanguages.size === AVAILABLE_LANGS.length
			&& usedPurposes.size === AVAILABLE_PURPOSES.length) {
			// all combinations are used, can't add new transcripts
			return null;
		}

		const onFileSelected = (e) => {
			const {target: {files}} = e;

			if(files && files.length === 1) {
				if(files[0].name.toLowerCase().endsWith('.vtt')) {
					if(video) {
						// find remaining purpose types and auto-assign this one
						let availablePurposes = new Set([...AVAILABLE_PURPOSES]);
						transcripts.forEach((trn) => {
							availablePurposes.delete(trn.purpose);
						});

						// just take the first available purpose, the user can change to any others later
						// (at this time, transcript and caption are the only two options anyway)
						video.applyCaptions(files[0], [...availablePurposes][0]).then((newTranscript) => {
							if(transcriptAdded) {
								transcriptAdded(newTranscript);
							}

							this.clearError();
						}).catch((resp) => {
							this.onError((resp && resp.message) || t('errors.update'));
						});
					}
				}
				else {
					this.onError(t('errors.fileType'));
				}

				// reset value so that next file select triggers a change event, even
				// if it's the same file as selected before
				this.addLink.value = '';
			}
		};

		return (<div className="add-transcript">
			<input type="file" accept=".vtt" onChange={onFileSelected} ref={this.attachAddLinkRef}/>
			<i className="icon-add"/><span>Add Transcript</span>
		</div>);
	}

	renderTranscriptItem (transcript, index) {
		return (<TranscriptItem transcript={transcript} key={index} transcripts={this.props.transcripts}
			video={this.props.video} transcriptUpdated={this.props.transcriptUpdated}
			transcriptRemoved={this.props.transcriptRemoved} transcriptReplaced={this.props.transcriptReplaced}
			onError={this.props.onError}/>);
	}

	renderTranscriptListWidget () {
		const mapFn = (transcript, index) => {
			return this.renderTranscriptItem(transcript, index);
		};

		return (<div className="transcript-list">{this.props.transcripts.map(mapFn)}</div>);
	}

	render () {
		// need to check if we have a video that is in a bad state, namely having
		// multiple transcripts applied to it that share the same language and purpose
		if(!areTranscriptsValid(this.props.transcripts)) {
			return (<div className="meta"><div className="error">{t('errors.general')}</div></div>);
		}

		return (<div className="manage-video-transcripts nti-labeled-input">
			<div className="label">{t('captions')}</div>
			{this.renderTranscriptListWidget()}
			{this.renderAddTranscriptWidget()}
		</div>);
	}
}
