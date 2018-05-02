const quantum = require('./quantum');

module.exports = [
    {name: 'h', qubits: 1, matrix: quantum.h, title: 'Hadamard'},
    {name: 'x', qubits: 1, matrix: quantum.x, title: 'Pauli-X'},
    {name: 'y', qubits: 1, matrix: quantum.y, title: 'Pauli-Y'},
    {name: 'z', qubits: 1, matrix: quantum.z, title: 'Pauli-Z'},
    {name: 's', qubits: 1, matrix: quantum.s, title: 'Phase Gate'},
    {name: 't', qubits: 1, matrix: quantum.r4, title: 'Same as R4'},
    {name: 'cnot', qubits: 2, matrix: quantum.cnot, title: 'Controlled Not'},
    {name: 'control', title: 'Control'},
    {name: 'swap', qubits: 2, matrix: quantum.swap, title: 'Swap'},
    {name: 'r2', qubits: 1, matrix: quantum.r2, title: 'Pi/2 Phase Rotatation'},
    {name: 'r4', qubits: 1, matrix: quantum.r4, title: 'Pi/4 Phase Rotatation'},
    {name: 'r8', qubits: 1, matrix: quantum.r8, title: 'Pi/8 Phase Rotatation'},
    {name: 'qft', qubits: Infinity, fn: quantum.qft, title: 'Quantum Fourier Transform'},
    {name: 'srn', qubits: 1, matrix: quantum.srn, title: 'Sqrt(Not)'},
];
