import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';
import {Prompt, DialogButtons, Loading} from 'nti-web-commons';
import {wait} from 'nti-commons';

import {createMediaSourceFromUrl} from '../services';

import {normalizeSource, parseEmbedCode} from './utils';

const DEFAULT_TEXT = {
	header: 'Enter a link to a YouTube, Vimeo, or Kaltura video.',
	cancel: 'Cancel',
	done: 'Done',
	placeholder: 'Enter a link or embed code',
	invalid: 'Invalid Link'
};

const t = scoped('nti-video.editor.EmbedInput', DEFAULT_TEXT);

async function getMediaSource (input) {
	const url = parseEmbedCode(input) || input;
	const {service, source} = await createMediaSourceFromUrl(url);
	const normalizedSource = normalizeSource(service, source);

	return {service, source: normalizedSource};
}

export default class EmbedInput extends React.Component {
	static show (value, config) {
		const {refocus} = config;

		return new Promise((fulfill, reject) => {
			Prompt.modal(
				<EmbedInput
					value={value}
					onSelect={fulfill}
					onCancel={reject}
				/>,
				{
					className: 'video-embed-input-container',
					refocus
				}
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

	componentWillReceiveProps (nextProps) {
		const {value:nextValue} = nextProps;
		const {value:prevValue} = this.props;

		if (nextValue !== prevValue) {
			this.setState({
				value: nextValue
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

		this.setState({
			saving: true
		}, () => {
			getMediaSource(value)
				.then(wait.min(500))
				.then((source) => {
					if (onSelect) { onSelect(source); }

					if (onDismiss) { onDismiss(); }
				})
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
