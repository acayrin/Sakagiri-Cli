import jq from 'jquery'
import nf from 'node-fetch'
import {
    JSDOM
} from 'jsdom'
import * as utils from '../Utils.js'

async function exec(id) {
    const ID = id || 1

    // preload
    const f = await (await nf(`https://coryn.club/item.php?id=${ID}`)).text()
    if (f.toLowerCase().includes('no result found')) {
        return undefined
    }

    const {
        window
    } = new JSDOM(f)
    const $ = jq(window)

    // jquery
    const name = $('.card-title').first().text().trim()
    const type = name.match(/\[.+?\]/g).pop()

    // The json
    const json = {
        'id': `T${ID}`, // item id
        'name': name.replace(type, '').trim(), // item name
        'type': type.replace(/[^\w\s]/gi, ''), // item type
        'sell': undefined, // item sell
        'proc': undefined, // item process 
        'stats': [], // item stats
        'drops': [], // item drops
        'uses': [], // item used for
        'recipe': { // item recipe
            'fee': 0, // recipe fee
            'set': 0, // recipe set
            'level': 0, // recipe level
            'difficulty': 0, // recipe difficulty
            'materials': [] // recipe materials
        }
    }

    // Item stats
    let outcur = 0
    $('.item-basestat').children('div').each(function () {
        const stat = []
        $(this).children('div').each(function () {
            const key = $(this).text().replace(/\t/g, '').trim()
            if (outcur > 0) {
                stat.push(key)
            }
        })
        if (outcur > 0) {
            json.stats.push(stat.join(' '))
        }
        outcur++
    })

    // Item obtain from
    $('.pagination-js-item').each(function () {
        const dyes = []
        $(this).find('div').each(function () {
            $(this).find('.dye-group').first().find('div').each(function () {
                if ($(this).css('background-color') !== '') {
                    dyes.push(utils.rgb2hex($(this).css('background-color')))
                } else {
                    dyes.push('0')
                }
            })
        })

        const where = $(this).find('div').first()
        let mob = where.find('a').first().attr('href')
        if (mob && mob.includes('monster.php')) {
            mob = `E${mob.match(/\d+/g)[0]}`
        } else {
            mob = where.text().replace(/\t/g, '').trim().replace(/\[(.*)\]/i, '')
        }
        json.drops.push({
            'from': mob,
            'dyes': dyes.length > 0 ? dyes : []
        })
    })

    // Item used for
    $('html').find('ul .styled-list').each(function () {
        const li = $(this).children('li').first()
        const a = li.find('a').first()
        const link = a.attr('href')
        const amount = (li.text().replace(a.text(), '').replace(/\n/g, '').trim()).match(/\d+/g)
        if (link.includes('item.php')) {
            json.uses.push({
                'for': `T${link.match(/\d+/g)[0]}`,
                'amount': amount ? Number(amount.pop()) : 1
            })
        }
    })

    // item proc/sell
    $('.item-prop.mini').each(function () {
        if ($(this).html().includes('Sell') && $(this).html().includes('Process')) {
            $(this).children('div').each(function () {
                if ($(this).text().includes('Sell')) {
                    json.sell = $(this).text().match(/\d+/g) ? $(this).text().match(/\d+/g).shift() : '0'
                }
                if ($(this).text().includes('Process')) {
                    json.proc = $(this).text().replace('Process', '').trim()
                }
            })
        }
    })
    // Item recipe
    if ($('html').html().includes('Recipe')) {
        $('.item-prop.mini').last().children('div').each(function () {
            const key = $(this).text().replace(/\s\s+/g, ' ')

            if (key.includes('Materials')) {
                $(this).find('li').each(function () {
                    const a = $(this).find('a').first()
                    let item = $(this).text().replace(/\-/g, '').replace(/\d+x/g, '').trim()
                    if (a.attr('href')) {
                        item = `T${a.attr('href').match(/\d+/g).shift()}`
                    }

                    const out = {
                        'item': item,
                        'amount': Number($(this).text().match(/\d+/g).shift())
                    }

                    json.recipe.materials.push(out)
                })
            }

            if (key.includes('Fee')) {
                json.recipe.fee = key.match(/\d+/g) ? Number(key.match(/\d+/g).shift()) : 0
            }
            if (key.includes('Set')) {
                json.recipe.set = key.match(/\d+/g) ? Number(key.match(/\d+/g).shift()) : 0
            }
            if (key.includes('Level')) {
                json.recipe.level = key.match(/\d+/g) ? Number(key.match(/\d+/g).shift()) : 0
            }
            if (key.includes('Difficulty')) {
                json.recipe.difficulty = key.match(/\d+/g) ? Number(key.match(/\d+/g).shift()) : 0
            }
        })
    }

    // postload
    return json
}

export {
    exec
}