var assert = require('assert');

module.exports = {
    reduceWithXor: reduceWithXor,
    getTriangle: getTriangle,
    constructTT: constructTT,
    getArity:    getArity,
    constructCircuit: constructCircuit,
    constructWorkspace: constructWorkspace,
};

function reduceWithXor (tt) {
    if (!tt.length) return [];
    var r = [];
    tt.reduce((x, y) => {
        r.push(xor(x, y));
        return y;
    });
    return r;
}

function getTriangle (tt) {
    var s = tt, r = [];
    tt.forEach(_ => {
        r.push(s);
        s = reduceWithXor(s);
    });
    return r;
}

function xor (x, y) {
    return x != y;
}

function constructTT (n) {
    if (n === 0) return [[]];

    var r = [];
    constructTT(n - 1).forEach(row => {
        var v1 = row.slice();
        var v2 = row.slice();
        v1.push(false)
        v2.push(true);
        r.push(v1);
        r.push(v2);
    });
    return r;
}

function getArity (n) {
    return Math.log2(n);
}

function constructCircuit (ttc) {
    var circuit = [];
    // ttc is a last column of TT
    var arity = getArity(ttc.length);

    var ttargs = constructTT(arity);

    var triangle = getTriangle(ttc);
    var left = triangle.map(arr => arr[0]);
    assert(left.length === ttc.length);

    for (var time = 0; time < left.length; time++) {
        var controls = getControls(ttargs[time], left[time]);
        if (controls.length > 0) {
            circuit.push({
                type: 'x',
                time: circuit.length,
                targets: [
                    arity
                ],
                controls: controls,
            });
        }
    }

    return circuit;
}

function constructWorkspace (ttc) {
    var qubits = getArity(ttc.length) + 1;
    var workspace = {
        gates: [],
        circuit: constructCircuit(ttc),
        qubits: qubits,
        input: new Array(qubits).fill(0),
        version: 1,
    };
    console.log(workspace);
    return workspace;
}

function getControls(args, flag) {
    var r = [];
    if (flag) {
        for (var i = 0; i < args.length; i++) {
            if (args[i]) {
                r.push(i);
            }
        }
    }
    return r;
}
