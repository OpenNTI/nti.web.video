import React from 'react';
import PropTypes from 'prop-types';
import {scoped} from 'nti-lib-locale';
import {Flyout, Prompt} from 'nti-web-commons';

// import { isTranscriptEditable, getTime, getTranscriptName } from './utils/TranscriptUtils';
import {getName, canEdit, getTime} from './utils';

const DEFAULT_TEXT = {
	edit: 'Edit',
	changeFile: 'Change File',
	remove: 'Remove',
	errors: {
		remove: 'Could not remove transcript',
		replace: 'Could not replace transcript',
		update: 'Could not update transcript',
		conflict: 'Cannot save transcript change.  This conflicts with an existing legacy transcript',
		fileType: 'Selected file must be a .vtt file',
		general: 'Unable to edit transcripts'
	},
	captionsLabel: 'Captions',
	transcriptLabel: 'Transcript',
	enLabel: 'EN',
	confirmReplace: 'Changing this will replace %(name)s',
	modifiedOn: 'Modified on %(time)s'
};

const t = scoped('nti-video.editor.Transcripts', DEFAULT_TEXT);
const swallow = () => {};


export default class TranscriptItem extends React.Component {
	static propTypes = {
		video: PropTypes.object.isRequired,
		transcript: PropTypes.object,
		beforeSave: PropTypes.func,
		afterSave: PropTypes.func,
		onError: PropTypes.func,
		clearError: PropTypes.func
	}


	attachFlyoutRef = x => this.flyout = x

	dismissFlyout () {
		if (this.flyout) {
			this.flyout.dismiss();
		}
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


	onLangChange = () => {
		//TODO: implement more languages in the future
	}


	async replaceTranscriptWithPurpose (existing, purpose) {
		const {transcript, video} = this.props;

		if (!canEdit(existing)) {
			this.onError(t('errors.conflict'));
			return;
		}

		this.beforeSave();

		try {
			await Prompt.areYouSure(t('confirmReplace', {name: getName(existing)}));

			try {
				await video.removeTranscript(existing);
				await video.updateTranscript(transcript, purpose);

				this.clearError();
			} catch (e) {
				this.onError(t('errors.replace'));
			}
		} catch (e) {
			swallow(e);
		} finally {
			this.afterSave();
		}
	}


	onPurposeChange = async (e) => {
		const {transcript, video} = this.props;
		const purpose = e.target.value;
		const existing = video.getTranscriptFor(purpose, transcript.lang);

		//if we will conflict with an existing one we need to replace it
		if (existing) {
			return this.replaceTranscriptWithPurpose(existing, purpose);
		}

		this.beforeSave();

		try {
			await video.updateTranscript(transcript, purpose);

			this.clearError();
		} catch (err) {
			this.onError(t('errors.update'));
		} finally {
			this.afterSave();
		}
	}


	onFileSelected = async (e) => {
		const {target: {files}} = e;
		const {video, transcript} = this.props;

		this.dismissFlyout();

		if (!files || !files.length) { return; }

		if (!files[0].name.toLowerCase().endsWith('.vtt')) {
			this.onError(t('errors.fileType'));
			return;
		}

		this.beforeSave();

		try {
			await video.updateTranscript(transcript, void 0, void 0, files[0]);
			this.clearError();
		} catch (err) {
			this.onError((err && err.message) || t('errors.update'));
		} finally {
			this.afterSave();
		}
	}


	onRemove = async () => {
		const {video, transcript} = this.props;

		this.dismissFlyout();

		this.beforeSave();

		try {
			await video.removeTranscript(transcript);
			this.clearError();
		} catch (err) {
			this.onError(t('errors.remove'));
		} finally {
			this.afterSave();
		}
	}


	render () {
		const {transcript} = this.props;

		const isLangEditable = false; //For now, EN is the only option so always disable
		const isPurposeEditable = transcript && canEdit(transcript);

		return (
			<div className="transcript-item">
				<div>
					<select defaultValue="en" onChange={this.onLangChange} disabled={!isLangEditable}>
						<option value="en" label={t('enLabel')}>{t('enLabel')}</option>
					</select>
					<select defaultValue={transcript.purpose} onChange={this.onPurposeChange} disabled={!isPurposeEditable}>
						<option value="captions" label={t('captionsLabel')}>{t('captionsLabel')}</option>
						<option value="normal" label={t('transcriptLabel')}>{t('transcriptLabel')}</option>
					</select>
					<span className="transcript-file-name">
						{getName(transcript)}
					</span>
					{this.renderEdit()}
				</div>
				<div className="modified-date">
					{t('modifiedOn', {time: getTime(transcript['Last Modified'])})}
				</div>
			</div>
		);
	}


	renderEdit () {
		const {transcript} = this.props;

		if (!canEdit(transcript)) { return null; }

		const editButton = (<span className="edit-link">{t('edit')}</span>);

		return (
			<Flyout.Triggered
				className="manage-video-transcripts-flyout-inner"
				trigger={editButton}
				horizontalAlign={Flyout.ALIGNMENTS.LEFT}
				sizine={Flyout.SIZES.MATCH_SIDE}
				ref={this.attachFlyoutRef}
			>
				<div>
					<div className="change-transcript">
						<input type="file" accept=".vtt" onChange={this.onFileSelected} />
						<span>{t('changeFile')}</span>
					</div>
					<div className="remove-transcript" onClick={this.onRemove}>
						<i className="icon-delete" />
						<span>{t('remove')}</span>
					</div>
				</div>
			</Flyout.Triggered>
		);
	}
}
