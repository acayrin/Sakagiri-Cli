import jq from 'jquery'
import nf from 'node-fetch'
import {
    JSDOM
} from 'jsdom'
import * as utils from '../Utils.js'

async function exec(id) {
    const ID = id || 1

    // preload
    const f = await (await nf(`https://coryn.club/monster.php?id=${ID}`)).text()
    if (f.toLowerCase().includes('no result found')) {
        return undefined
    }

    const {
        window
    } = new JSDOM(f)
    const $ = jq(window)

    // jquery
    const json = {
        id: `E${ID}`,
        name: undefined,
        level: undefined,
        type: undefined,
        hp: undefined,
        ele: undefined,
        exp: undefined,
        tamable: 'No',
        map: undefined,
        drops: []
    }

    // Monster name
    json.name = $('.card-title-inverse').text().replace(/\t/g, '').trim()

    // Monster stats
    $('.item-prop.col-2').children('div').each(function () {
        if ($(this).text().includes('Lv')) {
            json.level = Number($(this).children('p').last().text())
        }
        if ($(this).text().includes('Type')) {
            json.type = $(this).children('p').last().text() === '-' ?
                'Monster' : `Boss - ${$(this).children('p').last().text().replace(/[^a-zA-Z0-9 ]/g, '')}`
        }
        if ($(this).text().includes('HP')) {
            json.hp = isNaN($(this).children('p').last().text()) ?
                -1 : Number($(this).children('p').last().text())
        }
        if ($(this).text().includes('Element')) {
            json.ele = $(this).children('p').last().text()
        }
        if ($(this).text().includes('Exp')) {
            json.exp = isNaN($(this).children('p').last().text()) ?
                -1 : Number($(this).children('p').last().text())
        }
        if ($(this).text().includes('Tamable')) {
            json.tamable = $(this).children('p').last().text()
        }
    })

    // Monster map
    $('.item-prop').each(function () {
        if ($(this).html().includes('Spawn at')) {
            const a = $(this).find('a').first()
            if (a && a.text() !== 'Event') {
                json.map = `M${a.attr('href').match(/\d+/g).shift()}`
            } else {
                json.map = 'Event'
            }
        }
    })

    // Monster drops
    $('.monster-drop-list').children('.monster-drop').each(function () {
        const a = $(this).find('a').first()
        const d = a.attr('href').match(/\d+/g).shift()
        const dyes = []

        if ($(this).find('.dye-group').html()) {
            $(this).find('.dye-group').first().find('div').each(function () {
                if ($(this).css('background-color') !== '') {
                    dyes.push(utils.rgb2hex($(this).css('background-color')))
                } else {
                    dyes.push('0')
                }
            })
        }

        json.drops.push({
            id: `T${d}`,
            dyes: dyes
        })

        if (a.text() === json.name) {
            json.type = 'Miniboss'
        }
    })

    // postload
    return json
}

export {
    exec
}
