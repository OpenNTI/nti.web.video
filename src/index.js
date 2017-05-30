import {getHandler, getUrl, createMediaSourceFromUrl, getCanonicalUrlFromArguments} from './services';
import ComponentRaw from './Video';
import Component from './VideoWithAnalytics';
import Placeholder from './Placeholder';

export default ComponentRaw;

export {
	getHandler,
	getUrl,
	createMediaSourceFromUrl,
	getCanonicalUrlFromArguments,
	Component,
	Placeholder
};
