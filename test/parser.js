var assert = require('assert');
var p = require('../js/parser.js');

describe('parser', () => {
    it ('should parse correctly', () => {
        var tests = [
            ['1+2', ['+', 1, 2]],
            ['1 + 2 & 3', ['+', 1, ['&', 2, 3]]],
        ];
        tests.forEach(t => {
            assert.deepStrictEqual(p.parse(t[0]), t[1]);
        });
    });
});
