import React from 'react';
import ReactDOM from 'react-dom';
// import {getService} from 'nti-web-client';
// import {decodeFromURI} from 'nti-lib-ntiids';

import {Editor} from '../../src';
import 'nti-style-common/all.scss';
import 'nti-web-commons/lib/index.css';

window.$AppConfig = window.$AppConfig || {server: '/dataserver2/'};

// const FAKE_VIDEO = {
// 	sources: [
// 		new MediaSource({service: 'youtube', source: ['ip4z4k4jcRo']}),
// 		new MediaSource({service: 'vimeo', source: ['137531269']}),
// 		new MediaSource({service: 'kaltura', source: ['1500101:0_nmii7y4j']})
// 	]
// };

const videoId = 'tag:nextthought.com,2011-10:NTI-NTIVideo-system_20170627161300_697345_4A4DA731';

ReactDOM.render(
	React.createElement(Editor, {video: videoId}),
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
