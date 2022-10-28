import lzs from 'lz-string';
import chalk from 'chalk';
const { compress, decompress } = lzs;
import { isMainThread, threadId } from 'worker_threads';

// ===================================== Clean up duplicates in an Array =====================================
/**
 * Unique an Array
 *
 * @param {Array} a input array
 * @returns unique'd array
 */
export function uniq_fast(a: any[]) {
	const seen: any = {};
	const out: any[] = [];
	let j = 0;

	for (const item of a) {
		if (seen[item] !== 1) {
			seen[item] = 1;
			out[j] = item;
			j++;
		}
	}

	return out;
}
// ===================================== Clean up duplicates in an Array =====================================

// ===================================== Format seconds to HH:mm:ss =====================================
/**
 * Format seconds to HH:mm:ss format
 *
 * @param {Number} time seconds to convert
 * @return {String} formatted time
 */
export function time_format(time: number): string {
	time = Math.floor(time);
	const hrs = ~~(time / 3600);
	const mins = ~~((time % 3600) / 60);
	const secs = ~~time % 60;
	let ret = '';

	if (hrs > 0) {
		ret += `${hrs}:${mins < 10 ? '0' : ''}`;
	}

	ret += `${mins}:${secs < 10 ? '0' : ''}`;
	ret += `${secs}`;

	return ret;
}
// ===================================== Format seconds to HH:mm:ss =====================================

// ===================================== Json Diff =====================================
/**
 * Compare 2 json, return true if different, otherwise false
 *
 * @param {Object} _a 1st json object
 * @param {Object} _b 2nd json object
 * @return {boolean} result
 */
export function jsDiff(_a: any, _b: any): boolean {
	if (_a instanceof Function) {
		if (_b instanceof Function) {
			return _a.toString() === _b.toString();
		}
		return true;
	} else if (!_a || !_b) {
		return _a !== _b;
	} else if (_a === _b || _a.valueOf() === _b.valueOf()) {
		return false;
	} else if (Array.isArray(_a)) {
		if (Array.isArray(_b)) {
			if (_a.sort().length !== _b.sort().length) {
				return true;
			}
			for (const _aa of _a) {
				if (_b.indexOf(_aa) === -1) {
					const test = this.jsDiff(_b[_a.indexOf(_aa)], _aa);
					if (test) {
						return true;
					}
				}
			}
			return false;
		}
		return true;
	} else if (Object.keys(_a).length !== Object.keys(_b).length) {
		return true;
	} else {
		for (const _k in _a) {
			const test = this.jsDiff(_a[_k], _b[_k]);
			if (test) {
				return true;
			}
		}
	}
	return false;
}
// ===================================== Json Diff =====================================

// ===================================== Fast Filter =====================================
/**
 * Fast filter array
 *
 * @param {Array} a input array
 * @param {() => void} cb callback function
 * @returns filtered array
 */
export function filter(a: any[], cb: (...args: any) => any) {
	const f = [];
	for (const b of a) {
		if (cb(b)) {
			f.push(b);
		}
	}
	return f;
}
// ===================================== Fast Filter =====================================

// ===================================== JSON Compress =====================================
/**
 * Compress object into lzw string
 *
 * @param {Object|Array} json input json
 * @returns {String} output string
 */
export function zip(obj: any) {
	return compress(JSON.stringify(obj));
}
/**
 * Decompress lzw string into object
 *
 * @param {String} lzw input string
 * @returns {Object} output object
 */
export function unzip(lzw: any) {
	return JSON.parse(decompress(lzw));
}
// ===================================== JSON Compress =====================================

// ===================================== fillWith =====================================
/**
 * Fill a string with replacement
 *
 * @param {String} replace replacement string
 * @param {Number} amount amount to fill up
 * @param {Boolean} _backward fill backwards instead
 * @returns filled string
 */
export function fillWith(string: string, replace: string, amount: number, _backward?: boolean): string {
	let _s = '';
	for (let s = Math.abs(amount - string.valueOf().length); --s >= 0; ) {
		_s += replace;
	}
	return _backward ? _s + string.valueOf() : string.valueOf() + _s;
}
// ===================================== fillWith =====================================

// ===================================== Logger =====================================
/**
 * Log a string
 *
 * @param {String} msg input message
 * @param {Number} _level log level (1-3 : INFO-ERROR)
 * @param {String} _tag additional tag
 */
export async function log(msg: string, _level?: 1 | 2 | 3, _tag?: string) {
	const formatter = new Intl.DateTimeFormat([], {
		timeZone: 'Asia/Bangkok',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	});
	const u = formatter.format(new Date());
	const r = msg.toString().endsWith('\r');
	const w = isMainThread ? 'Main' : `Worker #${threadId}`;
	const l = _level || 1;
	_tag && (msg = `${_tag} ${msg}`);
	switch (l) {
		case 1:
			msg = chalk.gray(`[${u} - ${w} - INFO]`) + ` ${msg}`;
			break;
		case 2:
			msg = chalk.yellow(`[${u} - ${w} - WARN]`) + ` ${msg}`;
			break;
		case 3:
			msg = chalk.red(`[${u} - ${w} - ERROR]`) + ` ${msg}`;
			break;
		default:
			msg = chalk.gray(`[${u} - ${w} - INFO]`) + ` ${msg}`;
	}

	r && (msg = msg.slice(0, -1));
	msg = fillWith(msg, ' ', process.stdout.columns, false);
	msg += r ? '\r' : '\n';

	process.stdout.write(fillWith('', ' ', process.stdout.columns, false) + '\r');
	process.stdout.write(`${msg}`);
}
// ===================================== Logger =====================================

// ===================================== RGB2Hex =====================================
/**
 * Convert RGB color to Hex
 *
 * @param {String} rgb rgb color
 * @returns {String} hex color
 */
export function rgb2hex(rgb: string) {
	return rgb
		.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
		.slice(1)
		.map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
		.join('');
}
// ===================================== RGB2Hex =====================================
