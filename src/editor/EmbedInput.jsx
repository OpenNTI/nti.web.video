import './EmbedInput.scss';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from '@nti/lib-locale';
import {Prompt, DialogButtons, Loading} from '@nti/web-commons';
import {wait} from '@nti/lib-commons';

import {createMediaSourceFromUrl} from '../services';

import {parseEmbedCode} from './utils';

const DEFAULT_TEXT = {
	header: 'Enter a link to a YouTube, Vimeo, Wistia, or Kaltura video.',
	cancel: 'Cancel',
	done: 'Done',
	placeholder: 'Enter a link or embed code',
	invalid: 'Invalid Link'
};

const t = scoped('video.editor.EmbedInput', DEFAULT_TEXT);

async function getMediaSource (rawInput) {
	const input = rawInput.trim();
	const url = parseEmbedCode(input) || input;
	return await createMediaSourceFromUrl(url);
}

export default class EmbedInput extends React.Component {
	static show (value, config = {}) {
		return new Promise((fulfill, reject) => {
			Prompt.modal(
				<EmbedInput
					value={value}
					onSelect={fulfill}
					onCancel={reject}
				/>,
				{...config, className: 'video-embed-input-container'}
			);
		});
	}

	static propTypes = {
		value: PropTypes.string,
		onSelect: PropTypes.func,
		onCancel: PropTypes.func,
		onDismiss: PropTypes.func
	}

	constructor (props) {
		super(props);

		const {value} = props;

		this.state = {
			value
		};
	}

	componentDidUpdate ({value: previous}) {
		const {value} = this.props;

		if (value !== previous) {
			this.setState({
				value
			});
		}
	}


	onCancel = () => {
		const {onCancel, onDismiss} = this.props;

		if (onDismiss) {
			onDismiss();
		}

		if (onCancel) {
			onCancel();
		}
	}


	onSave = () => {
		const {value} = this.state;
		const {onSelect, onDismiss} = this.props;

		const doesSourceExist = (source) => source.getResolver();

		this.setState({
			saving: true
		}, () => {
			getMediaSource(value)
				.then(wait.min(500))
				.then((source) => doesSourceExist(source)
					.then(() => {
						if (onSelect) { onSelect(source); }

						if (onDismiss) { onDismiss(); }
					})
				)
				.catch(() => {
					this.setState({
						invalid: true,
						saving: false
					});
				});
		});
	}


	onInputChange = (e) => {
		this.setState({
			value: e.target.value,
			invalid: false
		});
	}


	render () {
		const {value, saving, invalid} = this.state;

		const buttons = [
			{label: t('cancel'), onClick: () => this.onCancel()},
			{label: t('done'), onClick: () => this.onSave()}
		];

		return (
			<div className="video-embed-input">
				<div className="picker">
					<h1 className="heading">{t('header')}</h1>
					<label>
						<span>Link</span>
						<input type="text" placeholder={t('placeholder')} value={value} onChange={this.onInputChange} />
					</label>
					{invalid && (<span className="error">{t('invalid')}</span>)}
				</div>
				<DialogButtons buttons={buttons} />
				<div className={cx('saving-mask', {saving})}>
					{saving && <Loading.Spinner />}
				</div>
			</div>
		);
	}
}
