import './VideoEditor.scss';
import React from 'react';
import PropTypes from 'prop-types';
import {scoped} from '@nti/lib-locale';
import {Input, DialogButtons, Loading, Panels, Prompt, Button, HOC} from '@nti/web-commons';
import {wait} from '@nti/lib-commons';

import Video from '../Video';


import {resolveVideo} from './utils';
import Transcripts from './transcripts';

const DEFAULT_TEXT = {
	modalTitle: 'Video Editor',
	title: {
		label: 'Title',
		placeholder: 'Enter a title'
	},
	captions: 'Transcript File (Optional)',
	transcriptNote: 'Only .vtt files are accepted at this time.',
	cancel: 'Cancel',
	save: 'Save',
	titleError: 'Unable to update the video title.',
	notFound: 'Video Not Found',
	deleteError: 'Failed to delete video.',
	saving: 'Saving',
	deleting: 'Deleting'
};

const t = scoped('video.editor.Editor', DEFAULT_TEXT);
const isModal = 'private:isModal';

export default class VideoEditor extends React.Component {
	static show (video, config, props) {
		return new Promise((select, reject) => {
			Prompt.modal(
				(<VideoEditor video={video} onSave={select} onCancel={reject} {...{[isModal]: true}} {...props}/>),
				{...config, className: 'video-editor-prompt'}
			);
		});
	}

	static propTypes = {
		video: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
		onSave: PropTypes.func,
		onCancel: PropTypes.func,
		onVideoDelete: PropTypes.func,

		onDismiss: PropTypes.func,
		[isModal]: PropTypes.bool
	}

	state = {}

	componentDidUpdate ({video}) {
		if (this.props.video !== video) {
			this.resolveState();
		}
	}

	componentDidMount () {
		this.resolveState(this.props);
	}


	componentWillUnmount () {
		if (this.unmountCallback) {
			this.unmountCallback();
		}
	}


	async resolveState (props = this.props) {
		const {video:videoProp} = props;

		try {
			const video = await resolveVideo(videoProp);

			this.setState({
				video,
				title: video.title || ''
			});
		} catch (e) {
			this.setState({
				error: t('notFound')
			});
		}
	}


	dismiss () {
		const {onDismiss} = this.props;

		if (onDismiss) {
			onDismiss();
		}
	}


	onTitleChange = (title) => {
		this.setState({title, error: false});
	}


	onSave = async () => {
		const {title, video} = this.state;
		const {onSave, [isModal]: modal} = this.props;

		this.setState({saving: true});

		try {
			await video.save({title});
			await wait(wait.SHORT);
		} catch (e) {
			this.setState({
				error: t('titleError')
			});
		}

		if (onSave && modal) {
			this.unmountCallback = () => {
				onSave(video);
			};

			this.dismiss();
		} else if (onSave) {
			onSave (video);
		}

		this.setState({
			saving: false
		});
	}


	onCancel = (e) => {
		const {onCancel, [isModal]: modal} = this.props;

		if (modal) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}

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

	onDelete = () => {
		Prompt.areYouSure('').then(() => {
			this.doDelete();
		});
	}

	doDelete = async () => {
		const {video} = this.state;
		const {onVideoDelete, onCancel, [isModal]: modal} = this.props;

		this.setState({deleting: true});

		try {
			await video.delete();
			await wait(wait.SHORT);
		} catch (e) {
			this.setState({
				error: t('deleteError')
			});
		}

		if (onVideoDelete && modal) {
			this.unmountCallback = () => {
				onVideoDelete(video);

				if (onCancel) {
					onCancel();
				}
			};

			this.dismiss();
		} else if (onVideoDelete) {
			onVideoDelete(video);

			if (onCancel) {
				onCancel();
			}
		} else if (onCancel) {
			onCancel();
		}

		this.setState({deleting: false});
	}

	beforeSave = () => this.setState({saving: true})
	afterSave = () => this.setState({saving: false})
	onError = (error) => this.setState({error})
	clearError = () => this.setState({error: null})

	onVideoChange = () => this.forceUpdate()

	render () {
		const {video, saving, deleting} = this.state;
		const {[isModal]: modal} = this.props;

		const buttons = [
			{label: t('cancel'), onClick: () => this.onCancel()},
			{label: t('save'), onClick: () => this.onSave()}
		];

		return (
			<div className="video-editor">
				{modal && (<Panels.TitleBar className="video-prompt-header" title={t('modalTitle')} iconAction={this.onCancel} />)}
				{video && this.renderVideo()}
				{video && (<DialogButtons buttons={buttons} />)}
				{!video && (<Loading.Mask />)}
				{(saving || deleting) && (
					<div className="saving-mask">
						<Loading.Mask message={deleting ? t('deleting') : t('saving')} />
					</div>
				)}
			</div>
		);
	}


	renderVideo = () => {
		const {title, video, error} = this.state;

		return (
			<HOC.ItemChanges item={video} onItemChange={this.onVideoChange}>
				<div className="editor-container">
					<div className="editor-wrapper">
						<Video src={video} />
						<div className="meta">
							{error && (<div className="error">{error}</div>)}
							<Input.Label className="title-label" label={t('title.label')}>
								<Input.Text className="title-input" value={title} onChange={this.onTitleChange} />
							</Input.Label>
							<Transcripts
								video={video}
								beforeSave={this.beforeSave}
								afterSave={this.afterSave}
								onError={this.onError}
								clearError={this.clearError}
							/>
							{video.hasLink('delete') && (
								<Button className="delete" onClick={this.onDelete}>
									<i className="icon-delete" />
									<span>Delete</span>
								</Button>
							)}
						</div>
					</div>
				</div>
			</HOC.ItemChanges>
		);
	}
}
