import React from 'react';
import PropTypes from 'prop-types';
import {scoped} from 'nti-lib-locale';
import {Flyout, Prompt} from 'nti-web-commons';

import { isTranscriptEditable, getTime, getTranscriptName } from './utils/TranscriptUtils';

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
	enLabel: 'EN'
};

const t = scoped('nti-video.editor.Transcripts', DEFAULT_TEXT);

export default class TranscriptItem extends React.Component {
	static propTypes = {
		video: PropTypes.object.isRequired,
		transcript: PropTypes.object,
		transcripts: PropTypes.arrayOf(PropTypes.object),
		transcriptAdded: PropTypes.func,
		transcriptRemoved: PropTypes.func,
		transcriptUpdated: PropTypes.func,
		transcriptReplaced: PropTypes.func,
		onError: PropTypes.func
	}

	attachFlyoutRef = x => this.flyout = x

	constructor (props) {
		super(props);
	}


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


	renderEditButton () {
		return (
			<span className="edit-link">{t('edit')}</span>
		);
	}


	renderEdit (transcript) {
		if(!isTranscriptEditable(transcript)) {
			return null;
		}

		const { video, transcriptReplaced } = this.props;

		const dismissFlyout = () => {
			if(this.flyout) {
				this.flyout.dismiss();
			}
		};

		const onFileSelected = (e) => {
			const {target: {files}} = e;

			dismissFlyout();

			if(files && files.length === 1) {
				if(files[0].name.toLowerCase().endsWith('.vtt')) {
					if(video) {
						video.replaceTranscript(transcript, files[0]).then((newTranscript) => {
							if(transcriptReplaced) {
								transcriptReplaced(newTranscript);
							}

							this.clearError();
						}).catch((resp) => {
							this.onError((resp && resp.message) || t('errors.update'), resp);
						});
					}
				}
				else {
					this.onError(t('errors.fileType'));
				}
			}
		};

		const removeHandler = () => {
			const { transcriptRemoved } = this.props;

			dismissFlyout();

			if(video) {
				video.removeTranscript(transcript).then(() => {
					if(transcriptRemoved) {
						transcriptRemoved(transcript);
					}

					this.clearError();
				}).catch((resp) => {
					this.onError(t('errors.remove'), resp);
				});
			}
		};

		return (<Flyout.Triggered
			className="manage-video-transcripts-flyout-inner"
			trigger={this.renderEditButton()}
			horizontalAlign={Flyout.ALIGNMENTS.LEFT}
			sizing={Flyout.SIZES.MATCH_SIDE}
			ref={this.attachFlyoutRef}
		>
			<div>
				<div className="change-transcript"><input type="file" accept=".vtt" onChange={onFileSelected}/><span>{t('changeFile')}</span></div>
				<div className="remove-transcript" onClick={removeHandler}><i className="icon-delete" />{t('remove')}</div>
			</div>
		</Flyout.Triggered>);
	}


	render () {
		const { transcript, video, transcriptUpdated, transcriptReplaced } = this.props;

		const onLangChange = (e) => {
			// TODO: implement more languages in the future
		};

		const onPurposeChange = (e) => {
			const newValue = e.target.value;
			let allTranscripts = [...this.props.transcripts];

			// check for conflicts
			const conflicts = allTranscripts.filter((trn) => {
				return trn.lang === transcript.lang && trn.purpose === newValue;
			});

			if(conflicts.length > 0) {
				// should check if the conflicting transcript is editable, if not, error
				let conflictingTranscript = conflicts[0];

				if(!isTranscriptEditable(conflictingTranscript)) {
					this.onError(t('errors.conflict'));
				}
				else {
					// prompt user to delete conflicting and update
					Prompt.areYouSure('Changing this will replace ' + getTranscriptName(conflictingTranscript)).then(() => {
						if(video) {
							video.removeTranscript(conflictingTranscript).then(() => {
								video.updateTranscript(transcript, newValue).then((updatedTranscript) => {
									if(transcriptReplaced) {
										transcriptReplaced(updatedTranscript, conflictingTranscript);
									}

									this.clearError();
								});
							}).catch((resp) => {
								this.onError(t('errors.replace'), resp);
							});
						}
					});
				}
			}
			else {
				// no conflicts with this change, so just modify the transcript
				// server-side
				if(video) {
					video.updateTranscript(transcript, newValue).then((updatedTranscript) => {
						if(transcriptUpdated) {
							transcriptUpdated(updatedTranscript);
						}

						this.clearError();
					}).catch((resp) => {
						this.onError(t('errors.update'), resp);
					});
				}
			}
		};

		const isLangEditable = false;	// for now, EN is the only option, so always disable
		const isPurposeEditable = isTranscriptEditable(transcript);

		return (
			<div className="transcript-item">
				<div>
					<select defaultValue="en" onChange={onLangChange} disabled={!isLangEditable}>
						<option value="en" label={t('enLabel')}>{t('enLabel')}</option>
					</select>
					<select defaultValue={transcript.purpose} onChange={onPurposeChange} disabled={!isPurposeEditable}>
						<option value="captions" label={t('captionsLabel')}>{t('captionsLabel')}</option>
						<option value="normal" label={t('transcriptLabel')}>{t('transcriptLabel')}</option>
					</select>
					<span className="transcript-file-name">
						{getTranscriptName(transcript)}
					</span>
					{this.renderEdit(transcript)}
				</div>
				<div className="modified-date">Modified on {getTime(transcript['Last Modified'])}</div>
			</div>);
	}
}
