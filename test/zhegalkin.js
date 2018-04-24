var assert = require('assert');
var z = require('../js/zhegalkin.js');

describe('zhegalkin.js', () => {
    it ('reduceWithXor', () => {
        var tests = [
            [[true, false, true, true],
             [true, true, false]],

            [[true, true, true, true],
             [false, false, false]],

            [[], []],
        ];
        tests.forEach(t => {
            assert.deepStrictEqual(z.reduceWithXor(t[0]), t[1])
        });
    });

    it('getTriangle', () => {
        var tests = [
            [
                [true, false, true, true],
                [[true, false, true, true],
                 [true, true, false],
                 [false, true],
                 [true]]
            ]
        ];

        tests.forEach(([arg, res]) => {
            assert.deepStrictEqual(z.getTriangle(arg), res);
        });
    });

    it('getArity', () => {
        var tests = [
            [4, 2],
            [8, 3],
            [1, 0],
        ];

        tests.forEach(([arg, res]) => {
            assert.deepStrictEqual(z.getArity(arg), res);
        });
    });

    it('evaluate', () => {
        var tests = [
            [['+', 0, 1],           [0, 1], true],
            [['+', 0, ['&', 0, 1]], [0, 1], false],
            [['+', 0, ['&', 0, 1]], [1, 1], false],
            [['+', 0, ['+', 0, 1]], [1, 0], false],
        ];

        tests.forEach(([ast, args, res]) => {
            assert.deepStrictEqual(z.evaluate(ast, args), res);
        });
    });
});
