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
		const {title, hasSaved, video: savedVideo} = this.state;
		const {onSave, video} = this.props;

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
				this.onError(`Unable to update transcript${errorMsg ? `: ${errorMsg}` : ''}`);
			}
		} catch (e) {
			this.onError('Unable to update title');
		}
	}

	render () {
		const {video} = this.props;
		const {title, error, errorMsg, saving} = this.state;

		const buttons = [
			{label: t('cancel'), onClick: () => this.onCancel()},
			{label: t('save'), onClick: () => this.onSave()}
		];

		const transcriptAdded = (newTranscript) => {
			let allTranscripts = [...this.state.transcripts];
			allTranscripts.push(newTranscript);
			this.setState({transcripts: allTranscripts});
		};

		const transcriptUpdated = (updatedTranscript) => {
			let allTranscripts = [...this.state.transcripts];
			allTranscripts = allTranscripts.map((trn) => {
				if(trn.NTIID === updatedTranscript.NTIID) {
					return updatedTranscript;
				}

				return trn;
			});

			this.setState({transcripts: allTranscripts});
		};

		const transcriptReplaced = (updatedTranscript, removedTranscript) => {
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
		};

		const transcriptRemoved = (removedTranscript) => {
			let allTranscripts = [...this.state.transcripts];
			allTranscripts = allTranscripts.filter((trn) => trn.NTIID !== removedTranscript.NTIID);
			this.setState({transcripts: allTranscripts});
		};

		return (
			<div className="video-editor">
				<div className="editor-container">
					<Video src={video} />
					<div className="meta">
						{error && (<div className="error">{errorMsg}</div>)}
						<Input.Label className="title-label" label={t('title.label')}>
							<Input.Text className="title-input" value={title} onChange={this.onTitleChange} />
						</Input.Label>
						<Transcripts transcripts={this.state.transcripts} video={video}
							transcriptAdded={transcriptAdded} transcriptUpdated={transcriptUpdated}
							transcriptRemoved={transcriptRemoved} transcriptReplaced={transcriptReplaced}
							onError={this.onError}/>
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
