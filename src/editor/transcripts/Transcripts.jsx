
import React from 'react';
import PropTypes from 'prop-types';
import {scoped} from 'nti-lib-locale';

// import { areTranscriptsValid } from '../utils/TranscriptUtils';
import {isValid} from './utils';
import TranscriptItem from './TranscriptItem';

const DEFAULT_TEXT = {
	add: 'Add Transcript',
	captions: 'Transcript File (Optional)',
	errors: {
		update: 'Could not update transcript',
		fileType: 'Selected file must be a .vtt file',
		general: 'Unable to edit transcripts'
	}
};

const t = scoped('nti-video.editor.Transcripts', DEFAULT_TEXT);

const AVAILABLE_LANGS = new Set(['en']);
const AVAILABLE_PURPOSES = new Set(['normal', 'captions']);


//TODO: figure out how to save the changes to the transcript all at once
//on save

export default class TranscriptEditor extends React.Component {
	static propTypes = {
		video: PropTypes.object.isRequired,
		onError: PropTypes.func,
		clearError: PropTypes.func,
		beforeSave: PropTypes.func,
		afterSave: PropTypes.func
	}

	attachAddLinkRef = x => this.addLink = x

	get transcripts () {
		const {video} = this.props;

		return (video && video.transcripts) || [];
	}


	beforeSave () {
		const {beforeSave} = this.props;

		if (beforeSave) {
			beforeSave();
		}
	}


	afterSave () {
		const {afterSave} = this.props;

		if (afterSave) {
			afterSave();
		}
	}


	onError (err) {
		const {onError} = this.props;

		if (onError) {
			onError(err);
		}
	}


	clearError () {
		const {clearError} = this.props;

		if (clearError) {
			clearError();
		}
	}


	resetAddLink () {
		if (this.addLink) {
			this.addLink.value = '';
		}
	}


	onFileSelected = async (e) => {
		const {target: {files}} = e;
		const {video, beforeSave, afterSave, onError, clearError} = this.props;
		const {transcripts} = this;

		//if we don't have a vtt file or a video
		if (!files || !files.length || !video) { return; }

		if (!files[0].name.toLowerCase().endsWith('.vtt')) {
			if (onError) {
				onError(t('errors.fileType'));
			}

			this.resetAddLink();
			return;
		}


		if (beforeSave) { beforeSave(); }

		const availablePurposes = new Set(AVAILABLE_PURPOSES);

		for (let transcript of transcripts) {
			availablePurposes.delete(transcript.purpose.toLowerCase());
		}

		try {
			await video.addTranscript(files[0], [...availablePurposes][0]);

			if (clearError) {
				clearError();
			}
		} catch (err) {
			if (onError) {
				onError((err && err.message) || t('errors.update'));
			}
		} finally {
			if (afterSave) { afterSave(); }

			this.resetAddLink();
		}
	}


	render () {
		const {transcripts} = this;

		if (!isValid(transcripts)) {
			return (
				<div className="meta">
					<div className="error">
						{t('errors.general')}
					</div>
				</div>
			);
		}

		return (
			<div className="manage-video-transcripts">
				<div className="label">{t('captions')}</div>
				{this.renderTranscriptList()}
				{this.renderAddTranscript()}
			</div>
		);
	}


	renderTranscriptList () {
		const {transcripts} = this;

		return (
			<div className="transcript-list">
				{transcripts.map((transcript, index) => {
					return (
						<TranscriptItem
							key={index}
							video={this.props.video}
							transcript={transcript}
							beforeSave={this.props.beforeSave}
							afterSave={this.props.afterSave}
							onError={this.props.onError}
							clearError={this.props.clearError}
						/>
					);
				})}
			</div>
		);
	}


	renderAddTranscript () {
		const {transcripts} = this;

		let usedLanguages = new Set();
		let usedPurposes = new Set();

		for (let transcript of transcripts) {
			usedLanguages.add(transcript.lang.toLowerCase());
			usedPurposes.add(transcript.purpose.toLowerCase());
		}

		//if all combinations are used, can't add a new transcript
		if (usedLanguages.size === AVAILABLE_LANGS.size && usedPurposes.size === AVAILABLE_PURPOSES.size) {
			return null;
		}

		return (
			<div className="add-transcript">
				<input type="file" accept=".vtt" onChange={this.onFileSelected} rel={this.attachAddLinkRef} />
				<i className="icon-add" />
				<span>{t('add')}</span>
			</div>
		);
	}
}
