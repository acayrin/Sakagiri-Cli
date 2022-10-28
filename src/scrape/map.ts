import jq from 'jquery';
import nf from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Map } from '../model/map';

async function exec(id: number) {
	const ID = id || 1;

	// preload
	const f = await (await nf(`https://coryn.club/map.php?id=${ID}`)).text();
	if (f.toLowerCase().includes('no result found')) {
		return undefined;
	}

	const { window } = new JSDOM(f);
	const $: any = jq(window);

	// jquery
	const list: any = [];
	$('.accordion.card-attach-bottom')
		.find('p')
		.each(function () {
			const a = $(this).find('a').first().attr('href');
			if (a) {
				list.push(`E${a.match(/\d+/g).shift()}`);
			} else {
				list.push(
					$(this)
						.text()
						.replace(/\[.+?\]/g, '')
						.trim()
				);
			}
		});
	const name = $('p.card-title').text();
	return {
		id: `M${ID}`,
		name: name,
		type: 'Map',
		monsters: list,
	} as Map;
}

export { exec };
