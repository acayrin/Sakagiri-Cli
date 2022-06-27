// ===================================== Require =====================================
// Console input
import chalk from 'chalk'
import prompt from 'prompt'
prompt.message = chalk.red('HH ')
prompt.delimiter = ''
// Flat-file database
import {
    resolve
} from 'path'
import {
    Low,
    JSONFile
} from 'lowdb'
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
        '  zip    [path]     --  generate a minified version of the database',
        '  unzip  [path]     --  generate a normal version of minified data file',
        '  update            --  update main database with Coryn.club',
        '  exit              --  exit the program',
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
        // ===================================== ZIP =====================================
        case 'ZIP': {
            // create new db file
            const version = `${Math.floor(Date.now() * Math.random() / 1000000)}`
            const file = arg.shift() || `./Sakagiri-Minified-${version}.json`
            let zip = {}

            for (const key of Object.keys(db.data)) {
                utils.log(`[1/4] Zipping '${key}'...\r`)
                if (db.data[key] instanceof Object || Array.isArray(db.data[key])) {
                    zip[key] = utils.zip(db.data[key])
                } else {
                    zip[key] = db.data[key]
                }
            }

            utils.log(`[2/4] Compressing...\r`)
            zip = utils.zip(zip)

            utils.log(`[3/4] Validating...\r`)
            const de = utils.unzip(zip)
            for (const key of Object.keys(de)) {
                try {
                    const dt = utils.unzip(de[key])
                    if (Array.isArray(dt)) {
                        for (const i of dt) {
                            const f = db.data[key].indexOf(i)
                            if (f !== -1) {
                                utils.log(`'${key}:${dt.indexOf(i)}' not found`, 2)
                            }
                        }
                    } else if (utils.jsDiff(db.data[key], dt)) {
                        utils.log(`'${key}' mismatched`, 2)
                    }
                } catch (e) {
                    if (utils.jsDiff(db.data[key], de[key])) {
                        utils.log(`'${key}' mismatched`, 2)
                    }
                }
            }

            utils.log(`[4/4] Saving...\r`)
            fs.writeFileSync(resolve(file), JSON.stringify(zip), 'utf8')

            utils.log(`Completed minifying to ${resolve(file)}`)
            break
        }
        // ===================================== ZIP ====================================



        // ===================================== UNZIP ====================================
        case 'UNZIP': {
            const file = arg.shift()
            if (!file || !fs.existsSync(resolve(file))) {
                utils.log(`No valid data file found`, 2)
                break
            }

            const g = utils.unzip(JSON.parse(fs.readFileSync(resolve(file), 'utf-8')))
            const j = {}
            for (const key of Object.keys(g)) {
                try {
                    j[key] = utils.unzip(g[key])
                } catch (e) {
                    j[key] = g[key]
                }
            }

            const e = resolve(file).split('.').slice(-1).pop()
            const f = `${resolve(file)}-UNZIP${e ? `.${e}` : ''}`
            const d = new Low(new JSONFile(f))
            d.data = j
            await d.write()

            utils.log(`Completed unzipping to ${f}`)
            break
        }
        // ===================================== UNZIP ====================================



        // ===================================== UPDATE =====================================
        case 'UPDATE': {
            const _n = Date.now()
            const a = []
            const l = []
            let i = 1;
            while (i++ <= db.data.index.length + 30) {
                a.push(i)
            }
            utils.log(`Starting full database update (expect: ${a.length})`)
            await promise.map(a.sort(), async c => {
                try {
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
                } catch (e) {
                    utils.log(e);
                }
            }, {
                concurrency: 30,
            })
                .catch((e) => {
                    console.log(e)
                })
                .finally(async () => {
                    const version = `${Math.floor(Date.now() / 1000000)}`
                    db.data.version = version
                    db.data.index = l
                    await db.write()
                    utils.log(`Updated ${db.data.index.length} items, took ${utils.time_format((Date.now() - _n) / 1000)}`)
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
