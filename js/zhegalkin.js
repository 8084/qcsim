var assert = require('assert');

module.exports = {
    reduceWithXor: reduceWithXor,
    getTriangle: getTriangle,
    constructTT: constructTT,
    getArity:    getArity,
    constructCircuit: constructCircuit,
    constructWorkspace: constructWorkspace,
    evaluate: evaluate,
    getTT: getTT,
    getMaxVar: getMaxVar,
    compareCircuits: compareCircuits,
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

function constructCircuit (ttc, useLeft = true) {

    // ttc is a last column of TT
    var arity = getArity(ttc.length);

    // Check if the proposition is a tautology
    if (ttc.every(x => x)) {
        return [ { type: 'x',
                   time: 0,
                   targets: [arity],
                   controls: [] } ];
    }

    var circuit = [];

    var ttargs = constructTT(arity);

    var triangle = getTriangle(ttc);

    var side;
    if (useLeft) {
        side = triangle.map(arr => arr[0]);
    } else {
        side = triangle.map(arr => arr.slice(-1)[0]);
    }

    assert(side.length === ttc.length);

    var shift = 0,
        flipResult = side[0];

    if (flipResult) {
        circuit.push({
            type: 'x',
            time: 0,
            targets: [arity],
            controls: [],
        });
    }

    // Add a column of Xs
    if (!useLeft) {
        for (var i = 0; i < arity; i++) {
            circuit.push({
                type: 'x',
                time: 0,
                targets: [i],
                controls: [],
            });
        }
    }

    if (!useLeft || flipResult) {
        shift = 1;
    }

    for (var i = 0; i < side.length; i++) {
        var controls = getControls(ttargs[i], side[i]);
        if (controls.length > 0) {
            circuit.push({
                type: 'x',
                time: shift,
                targets: [ arity ],
                controls: controls,
            });
            shift ++;
        }
    }

    return circuit;
}

function constructWorkspace (ttc, useLeft = true) {
    var workspace, qubits, input;

    qubits = getArity(ttc.length) + 1;
    workspace = {
        gates: [],
        circuit: constructCircuit(ttc, useLeft),
        qubits: qubits,
        input: new Array(qubits).fill(0),
        version: 1,
    };

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

function getTT (ast) {
    return constructTT(getMaxVar(ast)).map(a => evaluate(ast, a));
}

function evaluate(ast, args) {
    args = args.map(a => !!a);
    function ev(ast) {
        if (typeof ast === 'number') {
            return args[ast];
        } else if (ast[0] === '-') {
            return !ev(ast[1]);
        } else if (ast[0] === '&') {
            return ev(ast[1]) && ev(ast[2]);
        } else if (ast[0] === '|') {
            return ev(ast[1]) || ev(ast[2]);
        } else if (ast[0] === '+') {
            return ev(ast[1]) !== ev(ast[2]);
        } else {
            throw "Incorrect AST!";
        }
    }

    return ev(ast);
}

function getMaxVar (ast) {
    var tracker = { max : 0 };
    function getMax (ast) {
        if (typeof ast === 'number') {
            if (ast > tracker.max) {
                tracker.max = ast;
            }
        } else if (ast instanceof Array) {
            ast.forEach(getMax);
        }
    }

    getMax(ast, tracker);
    return tracker.max + 1;
}

function compareCircuits (c1, c2) {

    if (c1.length != c2.length) {
        return c1.length < c2.length ? c1 : c2;
    }

    var controlsCount = circuit =>
        circuit.map(gate => gate.controls.length).reduce((a, b) => a + b, 0);

    if (controlsCount(c1) > controlsCount(c2)) {
        return c2;
    }
    return c1;
}
