import React from 'react';
import PropTypes from 'prop-types';
import {scoped} from 'nti-lib-locale';
import {Flyout, Prompt} from 'nti-web-commons';

import { isTranscriptEditable, getTime, getTranscriptName, areTranscriptsValid } from './utils/TranscriptUtils';

const DEFAULT_TEXT = {
	captions: 'Transcript File (Optional)',
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
	}
};

const t = scoped('nti-video.editor.Transcripts', DEFAULT_TEXT);

const AVAILABLE_LANGS = ['en'];
const AVAILABLE_PURPOSES = ['normal', 'caption'];

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

	attachFlyoutRef = x => this.flyout = x

	attachAddLinkRef = x => this.addLink = x

	onError = (defaultMsg, response) => {
		if(this.props.onError) {
			if(response && response.responseText) {
				this.props.onError(JSON.parse(response.responseText).message);
			}
			else {
				this.props.onError(defaultMsg);
			}
		}
	};

	clearError = () => {
		if(this.props.onError) {
			this.props.onError();
		}
	}

	renderEdit (transcript) {
		if(!isTranscriptEditable(transcript)) {
			return null;
		}

		const { video, transcriptReplaced } = this.props;

		const onFileSelected = (e) => {
			const {target: {files}} = e;

			if(files && files.length === 1) {
				if(files[0].name.toLowerCase().endsWith('.vtt')) {
					if(video) {
						video.replaceTranscript(transcript, files[0]).then((newTranscript) => {
							if(transcriptReplaced) {
								transcriptReplaced(JSON.parse(newTranscript));
							}

							this.clearError();
						}).catch((resp) => {
							this.flyout.dismiss();

							this.onError(t('errors.update'), resp);
						});
					}
				}
				else {
					this.onError(t('errors.fileType'));
				}

				this.flyout.dismiss();
			}
		};

		const removeHandler = () => {
			const { transcriptRemoved } = this.props;

			if(video) {
				video.removeTranscript(transcript).then(() => {
					if(transcriptRemoved) {
						transcriptRemoved(transcript);
					}

					this.clearError();
				}).catch((resp) => {
					this.flyout.dismiss();

					this.onError(t('errors.remove'), resp);
				});
			}

			this.flyout.dismiss();
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

	renderEditButton () {
		return (
			<span className="edit-link">{t('edit')}</span>
		);
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

	renderTranscriptItem (transcript) {
		const { video, transcriptUpdated, transcriptReplaced } = this.props;

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
										transcriptReplaced(JSON.parse(updatedTranscript), conflictingTranscript);
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
							transcriptUpdated(JSON.parse(updatedTranscript));
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
						<option value="en" label="EN"/>
					</select>
					<select defaultValue={transcript.purpose} value={transcript.purpose} onChange={onPurposeChange} disabled={!isPurposeEditable}>
						<option value="caption" label="Caption"/>
						<option value="normal" label="Transcript"/>
					</select>
					<span className="transcript-file-name">
						{getTranscriptName(transcript)}
					</span>
					{this.renderEdit(transcript)}
				</div>
				<div className="modified-date">Modified on {getTime(transcript['Last Modified'])}</div>
			</div>);
	}

	renderTranscriptListWidget () {
		const mapFn = (transcript) => {
			return this.renderTranscriptItem(transcript);
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
