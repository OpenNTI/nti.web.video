import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';
import {Input, DialogButtons, Loading} from 'nti-web-commons';
import {wait} from 'nti-commons';

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
		video: PropTypes.object.isRequired,
		transcripts: PropTypes.arrayOf(PropTypes.object),
		onSave: PropTypes.func,
		onCancel: PropTypes.func
	}

	constructor (props) {
		super(props);

		const {video: {title}} = this.props;

		this.state = {
			title,
			hasSaved: false,
			transcripts: this.props.transcripts || []
		};
	}

	onTitleChange = (title) => {
		this.setState({title, error: false});
	}

	onCancel = () => {
		const {onCancel} = this.props;

		if (onCancel) {
			onCancel();
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
		const {onSave, video} = this.props;

		try {
			await video.save({title});

			this.setState({
				hasSaved: true
			});

			try {
				await wait(wait.SHORT);

				if (onSave) {
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
		const {onCancel} = this.props;

		return video.delete()
			.then(() => {
				onCancel('delete-video');
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
		const {video} = this.props;
		const {title, error, errorMsg, saving} = this.state;

		const buttons = [
			{label: t('cancel'), onClick: () => this.onCancel()},
			{label: t('save'), onClick: () => this.onSave()}
		];

		return (
			<div className="video-editor">
				<div className="editor-container">
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
				<DialogButtons buttons={buttons} />
				<div className={cx('saving-mask', {saving})}>
					{saving && (<Loading.Spinner />)}
				</div>
			</div>
		);
	}
}
