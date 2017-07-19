import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';
import {Input, DialogButtons, Loading, Flyout} from 'nti-web-commons';
import {wait} from 'nti-commons';

import Video from '../Video';

const DEFAULT_TEXT = {
	title: {
		label: 'Title',
		placeholder: 'Enter a title'
	},
	captions: 'Transcript File (Optional)',
	transcriptNote: 'Only .vtt files are accepted at this time.',
	cancel: 'Cancel',
	save: 'Save',
	error: 'Unable to save video'
};

const t = scoped('nti-video.editor.Editor', DEFAULT_TEXT);


export default class VideoEditor extends React.Component {
	static propTypes = {
		video: PropTypes.object.isRequired,
		transcript: PropTypes.object,
		badTranscriptState: PropTypes.bool,
		onSave: PropTypes.func,
		onCancel: PropTypes.func
	}

	constructor (props) {
		super(props);

		const {video: {title}} = this.props;

		this.state = {
			title,
			hasSaved: false,
			transcript: this.props.transcript
		};
	}

	attachFlyoutRef = x => this.flyout = x

	onTitleChange = (title) => {
		this.setState({title, error: false});
	}


	onFileChange = (file) => {
		this.setState({transcriptFile : file});
	}


	onCancel = () => {
		const {onCancel} = this.props;

		if (onCancel) {
			onCancel();
		}
	}


	onSave = async () => {
		const {title, transcriptFile, hasSaved, video: savedVideo, transcriptFlaggedForRemoval, transcript} = this.state;
		const {onSave, video} = this.props;

		const onError = msg => {
			this.setState({
				error: true,
				errorMsg: msg,
				saving: false
			});
		};

		try {
			if (!video.update) {
				video.update = (v, obj) => v.save(obj);
			}

			const newVideo = hasSaved
				? await video.update(savedVideo, {title})
				: await video.save({title});

			this.setState({
				video: newVideo,
				hasSaved: true
			});

			try {
				if(transcriptFile && !transcript) {
					// no transcript to update, just add a new file
					await video.applyCaptions(newVideo, transcriptFile);
				}
				else if(transcriptFile && transcript) {
					// replace transcript
					await video.replaceTranscript(transcript, transcriptFile);
				}
				else if(transcriptFlaggedForRemoval) {
					// remove transcript
					await video.removeTranscript(transcript);
				}

				await wait(wait.SHORT);

				if (onSave) {
					onSave();
				}

				this.setState({
					saving: false
				});
			} catch (e) {
				const response = JSON.parse(e.responseText || '{}');
				const errorMsg = (response.message || '').toLowerCase();
				onError(`Unable to update transcript${errorMsg ? `: ${errorMsg}` : ''}`);
			}
		} catch (e) {
			onError('Unable to update title');
		}
	}

	renderEdit () {
		const onFileSelected = (e) => {
			const {target: {files}} = e;

			if(files && files.length === 1) {
				this.setState({transcriptFile : files[0]});
				this.flyout.dismiss();
			}
		};

		const removeHandler = () => {
			this.setState( { transcriptFlaggedForRemoval: true, transcriptFile: null });
		};

		return (<Flyout.Triggered
			className="video-editor-flyout-inner"
			trigger={this.renderEditButton()}
			horizontalAlign={Flyout.ALIGNMENTS.LEFT}
			sizing={Flyout.SIZES.MATCH_SIDE}
			ref={this.attachFlyoutRef}
		>
			<div>
				<div className="change-transcript"><input type="file" accept=".vtt" onChange={onFileSelected}/><span>Change File</span></div>
				<div className="remove-transcript" onClick={removeHandler}><i className="icon-delete" />Remove</div>
			</div>
		</Flyout.Triggered>);
	}

	renderEditButton () {
		return (
			<span className="edit-link">Edit</span>
		);
	}

	getTime (time) {
		let date = new Date(time * 1000);
		return moment(date).format('MMMM Do YYYY, h:mm:ss a');
	}

	getPurposeLabel (purpose) {
		if(purpose === 'normal') {
			return 'transcript';
		}

		return purpose;
	}

	renderFileWidget () {
		if(this.state.transcriptFile) {
			return (<div className="current-transcript">{this.state.transcriptFile.name}{this.renderEdit()}</div>);
		}
		else if(!this.state.transcriptFlaggedForRemoval && this.state.transcript) {
			return (
				<div>
					<div className="current-transcript">{this.getPurposeLabel(this.state.transcript.purpose)} - {this.state.transcript.lang.toUpperCase()}{this.renderEdit()}</div>
					<div className="modified-date">Uploaded on {this.getTime(this.state.transcript.CreatedTime)}</div>
				</div>);
		}
		else {
			return (
				<div>
					<div className="transcript-note">{t('transcriptNote')}</div>
					<Input.File onFileChange={this.onFileChange} label="Upload a File" accept=".vtt" value={this.state.transcriptFile}/>
				</div>);
		}
	}

	renderTranscriptWidget () {
		const {badTranscriptState} = this.props;

		if(badTranscriptState) {
			return (<div className="meta"><div className="error">Unable to edit transcripts</div></div>);
		}

		return (<div className="nti-labeled-input">
			<div className="label">{t('captions')}</div>
			{this.renderFileWidget()}
		</div>);
	}

	render () {
		const {video} = this.props;
		const {title, error, errorMsg, saving} = this.state;

		let buttons = [
			{label: t('cancel'), onClick: () => this.onCancel()},
		];

		if(!error) {
			buttons.push({label: t('save'), onClick: () => this.onSave()});
		}

		return (
			<div className="video-editor">
				<div className="editor-container">
					<Video src={video} />
					<div className="meta">
						{error && (<div className="error">{errorMsg}</div>)}
						<Input.Label className="title-label" label={t('title.label')}>
							<Input.Text className="title-input" value={title} onChange={this.onTitleChange} />
						</Input.Label>
						{this.renderTranscriptWidget()}
					</div>
				</div>
				<DialogButtons buttons={buttons} />
				<div className={cx('saving-mask', {saving})}>
					{saving && (<Loading.Spinner />)}
				</div>
			</div>
		);
	}
}
