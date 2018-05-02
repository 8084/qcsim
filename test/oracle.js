const Circuit = require('../js/circuit.js');
const Workspace = require('../js/workspace.js');
const numeric = require('../js/libs/numeric.js');
const zhegalkin = require('../js/zhegalkin.js');
const assert = require('assert');
const util  = require('util');

var workspace = new Workspace();

describe('oracle generator', () => {
    it('passes tests for all predicates of arity 1 to 4', async function () {
        for (var arity = 1; arity < 4; arity++) {
            // For each possible arity construct all possible functions
            // each represented as the last columns of their truth tables
            var ttcs = zhegalkin.constructTT(Math.pow(2, arity)),
                // Plus one to store the result
                nqubits = arity + 1,
                circuit = new Circuit(arity + 1);

            for (var ttc of ttcs) {
                // Construct circuit for truth table
                var gates = zhegalkin.constructCircuit(ttc)
                                     .sort((a, b) => a.time - b.time);
                // Resolve gate names
                var circuit = Circuit.load(workspace, nqubits, gates);
                circuit.inputs = new Array(nqubits).fill(0);

                // Size of matrix
                const size = Math.pow(2, nqubits);

                for (var args of zhegalkin.constructTT(arity)) {
                    var input = new numeric.T(numeric.rep([size], 0),
                                              numeric.rep([size], 0));
                    var state = args.map(a => a ? '1' : '0').join('');
                    var dec = parseInt(state, 2)

                    // Multiply dec by 2 because `state` does not include
                    // the last qubit (the one that stores the output value).
                    input.x[dec * 2] = 1;

                    var amplitudes = getAmplitudes(nqubits, await circuit.evaluateP(input));

                    assert(
                        amplitudes.length === 1,
                        "Circuit that implements boolean function returned non-determenistic result: TT = " +
                        util.inspect(ttc) + ", inputs = " + util.inspect(state) + ' (' + dec + '), amplitudes = ' +
                        util.inspect(amplitudes)
                    );

                    assert.equal(
                        amplitudes[0].state, state + (ttc[dec] ? '1' : '0'),
                        "Result doesn't match the expected value: TT = " +
                        util.inspect(ttc) + ", inputs = " + util.inspect(state) + ' (' + dec + '), result = ' +
                        amplitudes + ', expected: ' + ttc[dec]
                    );
                }
            }
        }
    });
});


function getAmplitudes (nqubits, amplitudes) {
    var r = [];
    for (let i = 0; i < amplitudes.x.length; i++) {
        let amplitude = '';
        let state = '';
        for (let j = 0; j < nqubits; j++) {
            state = ((i & (1 << j)) >> j) + state;
        }
        amplitude += amplitudes.x[i].toFixed(8);
        amplitude += amplitudes.y[i] < 0 ? '-' : '+';
        amplitude += Math.abs(amplitudes.y[i]).toFixed(8) + 'i';
        let prob = Math.pow(amplitudes.x[i], 2);
        prob += Math.pow(amplitudes.y[i], 2);
        if (prob < numeric.epsilon) {
            continue;
        }
        const probability = (prob * 100).toFixed(4) + '%';
        r.push({ amp: amplitude, state: state, probability: probability });
    }
    return r;
}
