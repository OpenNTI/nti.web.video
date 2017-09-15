import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';
import {Input, DialogButtons, Loading, Panels, Prompt} from 'nti-web-commons';
import {wait} from 'nti-commons';
import {getService} from 'nti-web-client';

import Video from '../Video';

import Transcripts from './Transcripts';

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
		video: PropTypes.object,
		ntiid: PropTypes.string,
		transcripts: PropTypes.arrayOf(PropTypes.object),
		onSave: PropTypes.func,
		onCancel: PropTypes.func,
		onDismiss: PropTypes.func,
		onVideoDelete: PropTypes.func,
		isModal: PropTypes.bool
	}

	static defaultProps = {
		ntiid: '',
		isModal: false
	}

	static show (video, config) {
		return new Promise((select, reject) => {
			Prompt.modal(
				<VideoEditor
					video={video}
					onSave={select}
					onCancel={reject}
					isModal
				/>,
				{...config, className: 'video-editor-prompt'}
			);
		});
	}

	constructor (props) {
		super(props);

		const {video} = this.props;

		this.state = {
			title: (video && video.title) || '',
			video,
			hasSaved: false,
			transcripts: this.props.transcripts || []
		};
	}

	componentWillMount () {
		const { ntiid, video } = this.props;

		if (!video && ntiid !== '') {
			this.resolveVideo(ntiid);
		}
	}

	componentWillUnmount () {
		if (this.unmountCallback) {
			this.unmountCallback();
		}
	}

	async resolveVideo (ntiid) {
		const service = await getService();
		const video = await service.getObject(ntiid);
		const transcripts = await Promise.all(video.transcripts ?
			video.transcripts.map((transcript) => service.getObjectRaw(transcript.NTIID))
			: []);
		this.setState({
			video,
			title: video.title,
			transcripts
		});
	}

	onTitleChange = (title) => {
		this.setState({title, error: false});
	}

	onCancel = (e) => {
		const {onCancel, isModal} = this.props;

		if (isModal) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}

			//Use this call back to wait until the Chooser has been closed
			this.unmountCallback = () => {
				if (onCancel) {
					onCancel();
				}
			};

			this.dismiss();
		} else if (onCancel) {
			onCancel();
		}
	}

	dismiss () {
		const {onDismiss} = this.props;
		if (onDismiss) {
			onDismiss();
		}
	}

	onError = (msg) => {
		if(msg) {
			this.setState({
				error: true,
				errorMsg: msg,
				saving: false
			});
		}
		else {
			this.setState({
				error: false,
				errorMsg: msg,
				saving: false
			});
		}
	};

	onSave = async () => {
		const {title} = this.state;
		const {onSave, video, isModal} = this.props;

		try {
			await video.save({title});

			this.setState({
				hasSaved: true
			});

			try {
				await wait(wait.SHORT);

				if (onSave && isModal) {
					this.unmountCallback = () => {
						onSave(video);
					};

					this.dismiss();
				}
				else if (onSave) {
					onSave(video);
				}

				this.setState({
					saving: false
				});
			} catch (e) {
				const response = JSON.parse(e.responseText || '{}');
				const errorMsg = (response.message || '').toLowerCase();
				this.onError(`Unable to update transcript${errorMsg ? `: ${errorMsg}` : ''}`);
			}
		} catch (e) {
			this.onError('Unable to update title');
		}
	}

	delete = () => {
		const {video} = this.props;
		const {onVideoDelete} = this.props;

		return video.delete()
			.then(() => {
				if (onVideoDelete) {
					onVideoDelete(video.getID());
				}
				this.onCancel();
			});
	}


	transcriptAdded = (newTranscript) => {
		let allTranscripts = [...this.state.transcripts];
		allTranscripts.push(newTranscript);
		this.setState({transcripts: allTranscripts});
	}


	transcriptUpdated = (updatedTranscript) => {
		let allTranscripts = [...this.state.transcripts];
		allTranscripts = allTranscripts.map((trn) => {
			if(trn.NTIID === updatedTranscript.NTIID) {
				return updatedTranscript;
			}

			return trn;
		});

		this.setState({transcripts: allTranscripts});
	}


	transcriptReplaced = (updatedTranscript, removedTranscript) => {
		let allTranscripts = [...this.state.transcripts];
		allTranscripts = allTranscripts.map((trn) => {
			if(trn.NTIID === updatedTranscript.NTIID) {
				return updatedTranscript;
			}

			return trn;
		});

		if(removedTranscript) {
			allTranscripts = allTranscripts.filter((trn) => trn.NTIID !== removedTranscript.NTIID);
		}

		this.setState({transcripts: allTranscripts});
	}


	transcriptRemoved = (removedTranscript) => {
		let allTranscripts = [...this.state.transcripts];
		allTranscripts = allTranscripts.filter((trn) => trn.NTIID !== removedTranscript.NTIID);
		this.setState({transcripts: allTranscripts});
	}


	render () {
		const {title, error, errorMsg, saving, video} = this.state;
		const { isModal } = this.props;

		const buttons = [
			{label: t('cancel'), onClick: () => this.onCancel()},
			{label: t('save'), onClick: () => this.onSave()}
		];

		return (
			<div className="video-editor">
				{isModal && <Panels.TitleBar className="video-prompt-header" title="Video Editor" iconAction={this.onCancel} />}
				{video && (
					<div className="editor-container">
						<div className="editor-wrapper">
							<Video src={video} />
							<div className="meta">
								{error && (<div className="error">{errorMsg}</div>)}
								<Input.Label className="title-label" label={t('title.label')}>
									<Input.Text className="title-input" value={title} onChange={this.onTitleChange} />
								</Input.Label>
								<Transcripts
									video={video}
									transcripts={this.state.transcripts}
									transcriptAdded={this.transcriptAdded}
									transcriptUpdated={this.transcriptUpdated}
									transcriptRemoved={this.transcriptRemoved}
									transcriptReplaced={this.transcriptReplaced}
									onError={this.onError}
								/>
								{video.hasLink('delete') && <div className="delete nti-button" onClick={this.delete}><i className="icon-delete" /> Delete</div>}
							</div>
						</div>
					</div>
				)}
				<DialogButtons buttons={buttons} />
				<div className={cx('saving-mask', {saving})}>
					{saving && (<Loading.Spinner />)}
				</div>
			</div>
		);
	}
}
