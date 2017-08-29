import {getHandler, getUrl, createMediaSourceFromUrl, getCanonicalUrlFrom} from './services';
import Editor, {EmbedInput} from './editor';
import ComponentRaw from './Video';
import { selectFrom } from './video-resources';
import Component from './VideoWithAnalytics';
import Placeholder from './Placeholder';
import {UNSTARTED, ENDED, PLAYING, PAUSED, BUFFERING, CUED} from './Constants';

export default ComponentRaw;

export {
	getHandler,
	getUrl,
	createMediaSourceFromUrl,
	getCanonicalUrlFrom,
	Component,
	Placeholder,
	Editor,
	EmbedInput,
	selectFrom,
	UNSTARTED,
	ENDED,
	PLAYING,
	PAUSED,
	BUFFERING,
	CUED
};
