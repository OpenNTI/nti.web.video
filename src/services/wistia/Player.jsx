import React from 'react';
import {Models} from '@nti/lib-interfaces';

const {Providers} = Models.media || {};
const {WistiaProvider} = Providers || {};

export default class WistiaPlayer extends React.Component {
	static service = 'wistia';


	static getCanonicalURL (...args) {
		return WistiaProvider.getCanonicalURL(...args);
	}

	render () {
		return (
			<div>
				Wistia Player
			</div>
		);
	}
}