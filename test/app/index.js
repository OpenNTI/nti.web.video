import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Video from '../../src/index';

const FAKE_VIDEO = {
	sources: [
		{service: 'youtube', source: ['ip4z4k4jcRoadsf']},
		{service: 'vimeo', source: ['137531269asdf']},
		{service: 'kaltura', source: ['1500101:0_nmii7y4j']}
	]
};

ReactDOM.render(
	React.createElement(Video, {src: FAKE_VIDEO}),
	document.getElementById('youtube')
);

// ReactDOM.render(
// 	React.createElement(Video, {src: 'https://youtu.be/ip4z4k4jcRo'}),
// 	document.getElementById('youtube')
// );

ReactDOM.render(
	React.createElement(Video, {src: 'https://vimeo.com/137531269'}),
	document.getElementById('vimeo')
);

// ReactDOM.render(
// 	React.createElement(Video, {src: 'kaltura://1500101/0_nmii7y4j/'}),
// 	document.getElementById('kaltura')
// );
