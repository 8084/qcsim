const standardGates = require('./standard-gates');

module.exports = class Workspace {

    constructor() {
        this.gates = {};
        standardGates.forEach(gate => this.addGate(gate, true));
    }

    addGate(ops, std) {
        this.gates[ops.name] = {
            name: ops.name,
            qubits: ops.qubits,
            matrix: ops.matrix,
            circuit: ops.circuit,
            fn: ops.fn,
            title: ops.title,
            input: ops.input,
            std: std || false
        };
    }
}
