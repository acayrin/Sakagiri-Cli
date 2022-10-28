import { parentPort } from 'worker_threads';
import * as Items from './scrape/item.js';
import * as Monsters from './scrape/monster.js';
import * as Maps from './scrape/map.js';
import * as utils from './utils.js';
import promise from 'bluebird';

parentPort.on('message', (m) => {
	try {
		const msg: {
			code: number;
			size: number;
		} = JSON.parse(m);

		let failed = 0;
		let id = 0;

		utils.log(`Check max: ${msg.size}`)

		promise
			.map(
				Array.from(Array(msg.size + 100).keys()).map((x) => x + 1),
				async () => {
					if (failed >= 100) return;

					try {
						const result =
							msg.code === 1
								? await Items.exec(id++)
								: msg.code === 2
								? await Monsters.exec(id++)
								: await Maps.exec(id++);

						if (result !== undefined) {
							parentPort.postMessage(
								JSON.stringify({
									code: msg.code,
									data: result,
								})
							);
							failed = 0;
						} else {
							failed++;
						}
					} catch (e) {
						utils.log(`E~${failed} - ${e}`, 3);
						failed++;
					}
				},
				{ concurrency: 16 }
			)
			.finally(() => {
				utils.log('Completed update', 1);
				parentPort.postMessage(
					JSON.stringify({
						status: 1,
					})
				);
			});
	} catch (e) {
		parentPort.postMessage(
			JSON.stringify({
				status: 1,
				message: e,
			})
		);
	}
});
