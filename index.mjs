// ===================================== Require =====================================
// Console input
import chalk from 'chalk'
import prompt from 'prompt'
prompt.message = chalk.red('HH ')
prompt.delimiter = ''
// Flat-file database
import { resolve } from 'path'
import { Low, JSONFile } from 'lowdb'
import * as Items from './lib/Scraper/Item.mjs'
import * as Monsters from './lib/Scraper/Monster.mjs'
import * as Maps from './lib/Scraper/Map.mjs'
const db = new Low(new JSONFile(resolve('./Sakagiri.json')))
// Others
import fs from 'fs'
import promise from 'bluebird'
import utils from './lib/Utils.js'
// ===================================== Require =====================================



// ===================================== Functions =====================================
// load database
const load = async () => {
    await db.read()
    if (!db.data) {
        utils.log(`\n\n[!] Data file not found, please run 'update' first!\n\n`)
    }
}
// print help
const help = () => {
    return console.log([
        ''.fillWith('_', process.stdout.columns) + '\n',
        chalk.red('Saki-cli'),
        '- command line interface to interact with Sakagiri database',
        '',
        'Commands',
        '  minify [path]        --  generate a minified version of the database',
        '  update               --  update main database with Coryn.club',
        '  exit                 --  exit the program',
        ''.fillWith('_', process.stdout.columns) + '\n',
    ].join('\n'))
}
// ===================================== Functions =====================================



// ===================================== Main =====================================
const send = () => prompt.get(['>'], async (err, res) => {
    // ignore errors
    if (err) {
        return send()
    }

    // main block
    const arg = res['>'].match(/(?:[^\s"]+|"[^"]*")+/g)
    if (!arg) {
        return send()
    }

    const cmd = arg.shift().toUpperCase()
    switch (cmd) {
        // ===================================== MINIFY =====================================
        case 'MINIFY': {
            // create new db file
            const version = `${Math.floor(Date.now() / 10000000) }`
            const file = arg.shift() || `./Sakagiri-Minified-${version}.json`
            const mini = new Low(new JSONFile(resolve(file)))

            // loop through all items
            const total = []
            let count = 0
            await promise.map(db.data.index, i => {
                const x = utils.zip(i)
                // log
                utils.log(`[1/3] Adding ${i.id.fillWith(' ', 5)} [~${(x.length / JSON.stringify(i).length * 100).toFixed(2)} %] (${(count++ / db.data.index.length * 100).toFixed(2)}% completed)\r`)
                // write
                total.push(x)
            }, {
                concurrency: 25
            })

            // compress end array into lz-string
            utils.log(`[2/3] Compressing...\r`)
            mini.data = {
                version: version,
                index: utils.zip(total),
                colors: utils.zip(db.data.colors),
                toram: utils.zip(db.data.toram)
            }
            await mini.write()

            // validate that the values are the same
            utils.log(`[3/3] Validating...\r`)

            let matches = 0
            await promise.map(utils.unzip(mini.data.index), i => {
                // decompress the value
                const a = utils.unzip(i)
                // check if value exists
                const e = db.data.index.find(f => f.id === a.id)
                // check if value is the same
                if (e && !utils.jsDiff(a, e)) {
                    utils.log(`[3/3] [${(matches++).toString().fillWith(' ', 4, true)}/${db.data.index.length}] ${a.id.fillWith(' ', 5)} matched\r`)
                } else {
                    utils.log(`[3/3] [${(matches++).toString().fillWith(' ', 4, true)}/${db.data.index.length}] ${a.id.fillWith(' ', 5)} mismatched`, 2)
                    console.log(a)
                    console.log(e)
                }
            }, {
                concurrency: 25
            })

            // clean up
            utils.log(`+ Completed minify to '${file}'`)
            break
        }
        // ===================================== MINIFY ====================================



        // ===================================== UPDATE =====================================
        case 'UPDATE': {
            const _n = Date.now()
            const a = []
            const l = []
            for (let i = 1; i <= db.data.index.length + 30; i++) {
                a.push(i)
            }
            utils.log(`Starting full database update (expect: ${a.length})`)
            await promise.map(a.sort(), async c => {
                const i1 = await Items.exec(c)
                const i2 = await Monsters.exec(c)
                const i3 = await Maps.exec(c)
                if (i1) {
                    l.push(i1)
                    utils.log(`Added ${i1.id} (${l.length})\r`)
                }
                if (i2) {
                    l.push(i2)
                    utils.log(`Added ${i2.id} (${l.length})\r`)
                }
                if (i3) {
                    l.push(i3)
                    utils.log(`Added ${i3.id} (${l.length})\r`)
                }
            }, {
                concurrency: 25
            }).finally(async () => {
                const version = `${Math.floor(Date.now() / 1000000) }`
                db.data.version = version
                db.data.index = l
                await db.write()
                utils.log(`Updated ${db.data.index} items, took ${utils.time_format((Date.now() - _n) / 1000)}`)
                await load()
            })
            break
        }
        // ===================================== UPDATE =====================================



        // ===================================== EXIT =====================================
        case 'EXIT': {
            utils.log(`+ Goodbye`)
            process.exit()
        }
        // ===================================== EXIT =====================================



        // ===================================== Default =====================================
        default:
            help()
            // ===================================== Default =====================================
    }

    // start over
    send()
})
// ===================================== Main =====================================



// ===================================== Run =====================================
load().then(() => {
    prompt.start()
    help()
    send()
})
// ===================================== Run =====================================
