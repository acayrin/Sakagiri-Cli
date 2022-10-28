// ===================================== Require =====================================
// Console input
import chalk from 'chalk';
import prompt from 'prompt';
prompt.message = chalk.red('HH ');
prompt.delimiter = '';
// Flat-file database
import { resolve } from 'path';
import { Low, JSONFile } from 'lowdb';
const db = new Low(new JSONFile<L>(resolve('./Sakagiri.json')));
// Others
import { Worker } from 'worker_threads';
import * as utils from './utils.js';
import { Item } from './model/item';
import { Monster } from './model/monster';
import { Map } from './model/map';
type L = {
	index: (Item | Monster | Map)[],
	version: number;
	extra: {
		level_cap: number;
	};
};
/**
 * 
	index: {
		items: Item[];
		monsters: Monster[];
		maps: Map[];
	};
 */
// ===================================== Require =====================================

// ===================================== Functions =====================================
// load database
const load = async () => {
	await db.read();
	db.data ||= {
		index: [],
		version: -1,
		extra: {
			level_cap: 250,
		},
	};
};
// print help
const help = () => {
	return console.log(
		[
			utils.fillWith('', '_', process.stdout.columns) + '\n',
			chalk.red('Saki-cli'),
			'- command line interface to interact with Sakagiri database',
			'',
			'Commands',
			'  update            --  update main database with Coryn.club',
			'  exit              --  exit the program',
			utils.fillWith('', '_', process.stdout.columns) + '\n',
		].join('\n')
	);
};
// ===================================== Functions =====================================

// ===================================== Main =====================================
const send = (): void =>
	prompt.get(['>'], async (err, res) => {
		// ignore errors
		if (err) {
			return send();
		}

		// main block
		const arg = (res['>'] as string).match(/(?:[^\s"]+|"[^"]*")+/g);
		if (!arg) {
			return send();
		}

		const cmd = arg.shift().toUpperCase();
		switch (cmd) {
			// ===================================== UPDATE =====================================
			case 'UPDATE': {
				const _n = Date.now();
				const size = (db.data as L).index.length
				db.data = {
					index: [],
					version: -1,
					extra: {
						level_cap: 250,
					},
				};

				const workers_completed = {
					w_items: false,
					w_monsters: false,
					w_maps: false,
				};
				const _int = setInterval(() => {
					utils.log(
						`Updating data... I:${workers_completed.w_items} | E:${workers_completed.w_monsters} | M:${workers_completed.w_maps}`,
						1
					);
				}, 30e3);

				utils.log(`Updating from ${size} previous entries`, 1)

				await new Promise((resolve, _) => {
					for (let i = 1; i <= 3; i++) {
						const worker = new Worker('./dist/worker.js');
						worker.postMessage(
							JSON.stringify({
								code: i,
								size: size
							})
						);
						worker.on('message', (msg) => {
							const result: {
								code?: number;
								data?: Item | Monster | Map;
								status?: number;
								message?: string;
							} = JSON.parse(msg);

							if (result.data) {
								let _msg = '';
								let _total =
									(db.data as L).index.length
								switch (i) {
									case 1:
										(db.data as L).index.push(result.data as Item);
										_msg += `#${(db.data as L).index.length}`;
										break;
									case 2:
										(db.data as L).index.push(result.data as Monster);
										_msg += `#${(db.data as L).index.length}`;
										break;
									case 3:
										(db.data as L).index.push(result.data as Map);
										_msg += `#${(db.data as L).index.length}`;
										break;
								}
								utils.log(_msg + ` / ${_total} - Added ${result.data.id} - ${result.data.name}\r`, 1);
							}

							if (result.status !== undefined) {
								switch (i) {
									case 1:
										workers_completed.w_items = true;
										break;
									case 2:
										workers_completed.w_monsters = true;
										break;
									case 3:
										workers_completed.w_maps = true;
										break;
								}
							}

							if (workers_completed.w_items && workers_completed.w_monsters && workers_completed.w_maps)
								resolve('Completed');
						});
					}
				}).then(async () => {
					clearInterval(_int);

					(db.data as L).version = Math.floor(Date.now() / 1000000);
					await db.write();
					utils.log(
						`Updated ${(db.data as L).index.length} entries, took ${utils.time_format(
							(Date.now() - _n) / 1000
						)}`
					);
					await load();
				});
				break;
			}
			// ===================================== UPDATE =====================================

			// ===================================== EXIT =====================================
			case 'EXIT': {
				utils.log(`+ Goodbye`);
				process.exit();
			}
			// ===================================== EXIT =====================================

			// ===================================== Default =====================================
			default:
				help();
			// ===================================== Default =====================================
		}

		// start over
		send();
	});
// ===================================== Main =====================================

// ===================================== Run =====================================
load().then(() => {
	prompt.start();
	help();
	send();
});
// ===================================== Run =====================================
