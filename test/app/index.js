import React from 'react';
import ReactDOM from 'react-dom';
import {getService} from 'nti-web-client';
import {getModel} from 'nti-lib-interfaces';

import Video from '../../src/index';

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
				new MediaSource(service, null, {service: 'youtube', source: ['ip4z4k4jcRo']}),
				new MediaSource(service, null, {service: 'vimeo', source: ['137531269']}),
				new MediaSource(service, null, {service: 'kaltura', source: ['1500101:0_nmii7y4j']})
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
