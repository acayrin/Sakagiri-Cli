import {
    resolve
} from 'path'
import {
    Low,
    JSONFile
} from 'lowdb'
import utils from '../Utils.js'

async function save(json) {
    const db = new Low(new JSONFile(resolve('./Sakagiri.json')))
    await db.read()
    if (!db.data) {
        utils.log(`Created empty data file ${resolve('./Sakagiri.json')}`)
        db.data = {
            index: []
        }
    }
    for (const e of db.data.index) {
        if (e.id === json.id) {
            db.data.index.splice(db.data.index.indexOf(e), 1)
        }
    }
    utils.log(`Saved item ${json.id}\r`)
    db.data.index.push(json)
    await db.write()
}

export {
    save
}