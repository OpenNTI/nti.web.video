import React from 'react';
import ReactDOM from 'react-dom';
import {getService} from 'nti-web-client';
import {getModel} from 'nti-lib-interfaces';

import Video from '../../src/index';

import 'nti-style-common/all.scss';
import 'nti-web-commons/lib/index.css';

window.$AppConfig = window.$AppConfig || {server: '/dataserver2/'};

const MediaSource = getModel('mediasource');

// const FAKE_VIDEO = {
// 	sources: [
// 		new MediaSource({service: 'youtube', source: ['ip4z4k4jcRo']}),
// 		new MediaSource({service: 'vimeo', source: ['137531269']}),
// 		new MediaSource({service: 'kaltura', source: ['1500101:0_nmii7y4j']})
// 	]
// };

class Test extends React.Component {
	constructor (props) {
		super(props);

		this.state = {};
	}

	async componentDidMount () {
		const service = await getService();
		const video = {
			sources: [
				new MediaSource(service, null, {
					service: 'html5',
					source: [
						'http://media.w3.org/2010/05/bunny/movie.mp4',
						'https://media.w3.org/2010/05/sintel/trailer.ogv'
					]
				}),
			],
			transcripts: [
				{
					lang: 'en',
					purpose: 'normal',
					src: '/content/sites/platform.ou.edu/PRMIA_APRM_Series_F_2016_Associate_PRM_Webinar_Series/resources/PRMIA_APRM_Series_F_2016_Associate_PRM_Webinar_Series/4fa71922243430d7708f1782d5bcd1a25ce9d1d9/90784fa2c5c148922446e05d45ff35f0aee3e69b.vtt'
				},
				{
					lang: 'en',
					purpose: 'captions',
					src: '/content/sites/platform.ou.edu/PRMIA_APRM_Series_F_2016_Associate_PRM_Webinar_Series/resources/PRMIA_APRM_Series_F_2016_Associate_PRM_Webinar_Series/fcf153f1ef68555e43c6dbedf22b221ef34bbd77/90784fa2c5c148922446e05d45ff35f0aee3e69b.vtt'
				}
			]
		};

		this.setState({
			video
		});
	}


	render () {
		const {video} = this.state;

		if (!video) { return null; }

		return (<Video src={video} />);
	}
}

ReactDOM.render(
	React.createElement(Test, {}),
	document.getElementById('youtube')
);

// ReactDOM.render(
// 	React.createElement(Video, {src: 'https://youtu.be/ip4z4k4jcRo'}),
// 	document.getElementById('youtube')
// );

// ReactDOM.render(
// 	React.createElement(Video, {src: 'https://vimeo.com/137531269'}),
// 	document.getElementById('vimeo')
// );

// ReactDOM.render(
// 	React.createElement(Video, {src: 'kaltura://1500101/0_nmii7y4j/'}),
// 	document.getElementById('kaltura')
// );
