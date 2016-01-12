import Vimeo from '../index';

const ID = '11111111';
const ALBUM_ID = '2222222';

const VIMEO_URLS = [
	`//vimeo.com/${ID}`,
	`//www.vimeo.com/${ID}`,
	`//vimeo.com/channels/${ID}`,
	`//vimeo.com/channels/yourchannel/${ID}`,
	`//vimeo.com/groups/name/videos/${ID}`,
	`//vimeo.com/album/${ALBUM_ID}/video/${ID}`,
	`//vimeo.com/${ID}?param=test`,
	`//player.vimeo.com/video/${ID}`
].reduce((out, url) => out.concat([
	//generate the protocol variations:
	url, //protocol-less
	`http:${url}`, //insecure
	`https:${url}` //secure
]), []);

describe('Vimeo tests', ()=> {

	it('should handle all forms of Vimeo URLS', ()=> {
		for (let url of VIMEO_URLS) {
			expect(Vimeo.getID(url)).toBe(ID);
		}
	});


	it('should handle our crazy ass-backwards custom protocol url', ()=> {
		expect(Vimeo.getID(`vimeo://${ID}`)).toBe(ID);
	});

});
