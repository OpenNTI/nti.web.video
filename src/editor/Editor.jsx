import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';
import {Input, DialogButtons, Loading} from 'nti-web-commons';
import {wait} from 'nti-commons';

import Video from '../Video';

const DEFAULT_TEXT = {
	title: {
		label: 'Title',
		placeholder: 'Enter a title'
	},
	captions: 'Transcript File (Optional)',
	cancel: 'Cancel',
	save: 'Save',
	error: 'Unable to save video'
};

const t = scoped('nti-video.editor.Editor', DEFAULT_TEXT);


export default class VideoEditor extends React.Component {
	static propTypes = {
		video: PropTypes.object.isRequired,
		transcript: PropTypes.object,
		onSave: PropTypes.func,
		onCancel: PropTypes.func
	}

	constructor (props) {
		super(props);

		const {video: {title}} = this.props;

		this.state = {
			title
		};
	}


	onTitleChange = (title) => {
		this.setState({title, error: false});
	}


	onFileChange = (file) => {
		this.setState({captionsFile : file});
	}


	onCancel = () => {
		const {onCancel} = this.props;

		if (onCancel) {
			onCancel();
		}
	}


	onSave = async () => {
		const {title, captionsFile} = this.state;
		const {onSave, video} = this.props;

		const onError = (msg) => {
			this.setState({
				error: true,
				errorMsg: msg,
				saving: false
			});
		};

		try {
			const newVideo = await video.save({title});

			try {
				await video.applyCaptions(newVideo, captionsFile);
				await wait(wait.SHORT);

				if (onSave) {
					onSave();
				}

				this.setState({
					saving: false
				});
			} catch (e) {
				onError('Unable to update caption');
			}
		} catch (e) {
			onError('Unable to update title');
		}
	}

	render () {
		const {video} = this.props;
		const {title, error, saving} = this.state;

		const buttons = [
			{label: t('cancel'), onClick: () => this.onCancel()},
			{label: t('save'), onClick: () => this.onSave()}
		];

		let defaultText = 'No file selected';

		if(this.props.transcript) {
			defaultText = 'This video currently has a transcript (' + this.props.transcript.lang.toUpperCase() + ' language)';
		}

		return (
			<div className="video-editor">
				<div className="editor-container">
					<Video src={video} />
					<div className="meta">
						{error && (<span className="error">{error}</span>)}
						<Input.Label className="title-label" label={t('title.label')}>
							<Input.Text className="title-input" value={title} onChange={this.onTitleChange} />
						</Input.Label>
						<Input.Label className="title-label" label={t('captions')}>
							<Input.File onFileChange={this.onFileChange} defaultText={defaultText} accept=".vtt" value={this.state.captionsFile}/>
						</Input.Label>
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
