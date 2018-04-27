const FILE_VERSION = 1;

const Application = require('./application');
const examples = require('./examples');
const zhegalkin = require('./zhegalkin');
const parser = require('./parser');
const Circuit = require('./circuit');
const Gate = require('./gate');

const displayAmplitudes = (nqubits, amplitudes) => {
    const table = document.querySelector('#amplitudes');
    table.innerHTML = '';
    const hideBtn = document.querySelector('#hide-impossible');
    const hide = hideBtn.innerHTML !== '(hide impossible)';
    document.querySelector('#amplitudes-container').style.display = 'block';
    for (let i = 0; i < amplitudes.x.length; i++) {
        let amplitude = '';
        let state = '';
        for (let j = 0; j < nqubits; j++) {
            state = ((i & (1 << j)) >> j) + state;
        }
        amplitude += amplitudes.x[i].toFixed(8);
        amplitude += amplitudes.y[i] < 0 ? '-' : '+';
        amplitude += Math.abs(amplitudes.y[i]).toFixed(8) + 'i';
        const row = document.createElement('tr');
        let prob = Math.pow(amplitudes.x[i], 2);
        prob += Math.pow(amplitudes.y[i], 2);
        if (prob < numeric.epsilon) {
            if (hide) {
                continue;
            } else {
                row.style.color = '#ccc';
            }
        }
        const probability = (prob * 100).toFixed(4) + '%';
        row.innerHTML = `
            <td style="text-align: right">${amplitude}</td>
            <td>|${state}></td>
            <td style="text-indent: 20px">${probability}</td>
        `;
        table.appendChild(row);
    }
}

window.onload = () => {
    document.querySelector('#toolbar').onselectstart = evt => false;
    const canvas = document.getElementById('canvas');
    const app = new Application(canvas, 2);
    const editor = app.editor;

    const hideBtn = document.querySelector('#hide-impossible');
    hideBtn.onclick = evt => {
        evt.preventDefault();
        const hide = '(hide impossible)';
        const show = '(show all)';
        hideBtn.innerHTML = hideBtn.innerHTML == hide ? show : hide;
        document.querySelector('#evaluate').click();
    };

    document.querySelector('#reset').onclick = evt => {
        evt.preventDefault();
        const ok = confirm('Clear entire circuit?');
        if (ok) {
            app.circuit.gates = [];
            editor.render();
        }
    };

    document.querySelector('#evaluate').onclick = evt => {
        evt.preventDefault();
        app.circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, app.circuit.nqubits);
        const amplitudes = new numeric.T(numeric.rep([size], 0), numeric.rep([size], 0));
        const state = editor.input.join('');
        amplitudes.x[parseInt(state, 2)] = 1;
        app.applyCircuit(app.circuit, amplitudes, amplitudes => {
            displayAmplitudes(app.circuit.nqubits, amplitudes.div(amplitudes.norm2()))
        });
    };

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
            const row = document.createElement('tr');
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

    function runAssertions (circuit, ast) {
        var arity = zhegalkin.getMaxVar(ast);
        var ttargs = zhegalkin.constructTT(arity);

        circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, circuit.nqubits);

        ttargs.forEach(arglist => {
            var state = arglist.map(e => e ? '1' : '0').join('');
            ((state) => {
                var amplitudes = new numeric.T(numeric.rep([size], 0), numeric.rep([size], 0));
                amplitudes.x[parseInt(state, 2)] = 1;
                circuit.evaluate(amplitudes, () => {}, x => {
                    var args = Array.from(state).map(e => e == '1')
                    var st = getAmplitudes(arity + 1, x)[0].state;
                    var result = st.slice(-1) == '1';
                    var asserted = zhegalkin.evaluate(ast, args);
                    if (result != asserted) {
                        console.log('Error! state: ', state, 'result: ', result, 'asserted: ', asserted, 'Output state:', st);
                        alert('Error! See JS console.');
                    } else {
                    }
                });
            })(state + '0');
        });
    }

    document.body.onkeydown = evt => {
        // Catch hotkeys
        if (evt.which == 'S'.charCodeAt(0) && evt.ctrlKey) {
            evt.preventDefault();
            document.querySelector('#compile').click();
        } else if (evt.which == 13) {
            evt.preventDefault();
            document.querySelector('#evaluate').click();
        }
    };

    document.querySelector('#compile').onclick = evt => {
        evt.preventDefault();
        app.circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, app.circuit.nqubits);
        const U = new numeric.T(numeric.identity(size), numeric.rep([size, size], 0));
        app.applyCircuit(app.circuit, U, U => {
            const name = prompt('Name of gate:', 'F');
            if (name) {
                if (app.workspace.gates[name]) {
                    app.workspace.gates[name].matrix = U;
                    app.workspace.gates[name].circuit = app.circuit.copy();
                    app.workspace.gates[name].nqubits = app.circuit.nqubits;
                    app.workspace.gates[name].input = app.editor.input;
                } else {
                    app.workspace.addGate({
                        name: name,
                        qubits: app.circuit.nqubits,
                        matrix: U,
                        circuit: app.circuit.copy(),
                        input: app.editor.input
                    });
                }
            }
        });
    };

    document.querySelector('#exportImage').onclick = evt => {
        evt.preventDefault();
        const oldlength = editor.length;
        const times = app.circuit.gates.map(gate => gate.time);
        editor.resize(app.circuit.nqubits, Math.max.apply(Math, times) + 1);
        window.open(editor.draw.canvas.toDataURL("image/png"));
        editor.resize(app.circuit.nqubits, oldlength);
    };

    document.querySelector('#exportMatrix').onclick = evt => {
        evt.preventDefault();
        app.circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, app.circuit.nqubits);
        const U = new numeric.T(numeric.identity(size), numeric.rep([size, size], 0));
        app.applyCircuit(app.circuit, U, U => {
            const child = window.open('', 'matrix.csv', ',resizable=yes,scrollbars=yes,menubar=yes,toolbar=yes,titlebar=yes,hotkeys=yes,status=1,dependent=no');
            for (let i = 0; i < U.x.length; i++) {
                const row = [];
                for (let j = 0; j < U.x[i].length; j++) {
                    row.push(U.x[i][j].toFixed(16) + '+' + U.y[i][j].toFixed(16) + 'i');
                }
                child.document.write(row.join(',') + '<br>');
            }
        });
    };

    document.querySelector('#importJSON').onclick = evt => {
        evt.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = evt => {
            const reader = new FileReader();
            reader.onloadend = evt => {
                if (evt.target.readyState !== FileReader.DONE) {
                    return;
                }
                app.loadWorkspace(JSON.parse(evt.target.result));
            };
            reader.readAsText(evt.target.files[0]);
        };
        input.click();
    };

    document.querySelector('#exportJSON').onclick = evt => {
        evt.preventDefault();
        const out = app.exportWorkspace();
        out.version = FILE_VERSION;
        const blob = new Blob([JSON.stringify(out, null, 4)]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = 'workspace.json';
        a.click();
        a.remove();
    };

    const resize = size => {
        const newGates = app.circuit.gates.filter(gate => {
            return gate.range[1] < size;
        });
        if (newGates.length < app.circuit.gates.length) {
            const count = app.circuit.gates.length - newGates.length;
            const ok = confirm('Resizing will remove ' + count + ' gates. Resize anyway?')
            if (ok) {
                app.circuit.gates = newGates;
                editor.resize(size, editor.length);
            }
        } else {
            editor.resize(size, editor.length);
        }
        document.querySelector('#qubitsCount').innerHTML = app.circuit.nqubits;
    };

    var promptResize = evt => {
        evt.preventDefault();
        var r = prompt("Enter new number (values more than 10 are not recommended):", app.circuit.nqubits);
        if (r === null) { return; }
        r = Number.parseInt(r);
        if (!Number.isInteger(r) || r < 1) {
            alert("Please enter positive integer!");
            return;
        }
        resize(r);
    }

    resize(2);

    document.querySelector('#promptResize').onclick = promptResize;

    document.querySelector('#open-oraclegen').onclick = env => {
        document.querySelector('#modal').style.display = 'block';
        document.querySelector('#oraclegen-container').style.display = 'block';
    }

    const getUrlVars = () => {
        const vars = [];
        const location = window.location.href;
        const hashes = location.slice(location.indexOf('?') + 1).split('&');
        for(let i = 0; i < hashes.length; i++) {
            const hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = decodeURI(hash[1]);
        }
        return vars;
    }

    const EXAMPLES = [
        ["Toffoli", examples.TOFFOLI],
        ["Bell State", examples.BELL_STATE],
        ["2 Qubit QFT", examples.QFT2],
        ["4 Qubit QFT", examples.QFT4],
        ["Grover's Algorithm", examples.GROVERS_ALGORITHM],
        ["Quantum Teleportation", examples.TELEPORTATION],
    ];

    const examplesEl = document.querySelector('#examples');
    EXAMPLES.forEach((example, i) => {
        const name = example[0];
        const json = example[1];
        const a = document.createElement('a');
        a.href = '#';
        a.appendChild(document.createTextNode(name));
        a.onclick = evt => {
            evt.preventDefault();
            open('?example=' + example[0]);
        };
        if (getUrlVars().example == name) {
            app.loadWorkspace(json);
        }
        const li = document.createElement('li');
        li.appendChild(a);
        examplesEl.appendChild(li);
    });

    document.querySelector('#about').onclick = evt => {
        document.querySelector('#modal').style.display = 'block';
        document.querySelector('#about-container').style.display = 'block';
    };

    document.querySelector('#modal').onclick = evt => {
        document.querySelector('#modal').style.display = 'none';
        document.querySelector('#about-container').style.display = 'none';
        document.querySelector('#oraclegen-container').style.display = 'none';
    };

    function updateTruthTable (ast) {
        ast = ast || checkInput();

        if (ast === null) return;

        var arity = zhegalkin.getMaxVar(ast);
        var ttargs = zhegalkin.constructTT(arity);

        // construct last column of truth table;
        var ttc = ttargs.map(args => {
            return zhegalkin.evaluate(ast, args);
        });

        var ttargs = zhegalkin.constructTT(arity);

        // remove the old table
        var ttcontainer = document.querySelector('#tt-container')
        ttcontainer.innerHTML = '';
        ttcontainer.style.display = 'block';

        // create a new one
        var tte = document.createElement('table');
        tte.border = '1';

        // add table header
        var th = document.createElement('tr');
        for (var i = 0; i < ttargs[0].length; i++) {
            var td = document.createElement('td');
            td.className = 'ttheader';
            td.textContent = i;
            th.appendChild(td);
        }

        var td = document.createElement('td');
        td.className = 'ttheader';
        td.textContent = 'result'
        th.appendChild(td);
        tte.appendChild(th);

        // add table contents
        for (var i = 0; i < ttargs.length; i++) {
            var arglist = ttargs[i];
            var tr = document.createElement('tr');
            for (var arg of arglist) {
                var td = document.createElement('td');
                td.textContent = arg ? '1' : '0';
                tr.appendChild(td);
            }
            var td = document.createElement('td');
            td.textContent = ttc[i] ? '1' : '0';
            td.className = 'ttvalue';
            tr.appendChild(td);
            tte.appendChild(tr);
        }

        ttcontainer.appendChild(tte);
    }

    function updateAST (ast) {
        ast = ast || checkInput();
        var container = document.querySelector('#ast-container');
        container.textContent = JSON.stringify(ast, null, 4);
        container.style.display = 'block';
    }

    function checkInput () {
        var input = document.querySelector('#prop-oracle').value;
        var status = document.querySelector('#parse-status');
        try {
            var ast = parser.parse(input);
            status.textContent = 'The proposition is valid';
            status.style.color = 'green';
            return ast;
        } catch (e) {
            status.textContent = e.message;
            status.style.color = 'red';
            return null;
        }
    }

    function clearTruthTable () {
        document.querySelector('#tt-container').style.display = 'none';
    }

    function clearAST () {
        document.querySelector('#ast-container').style.display = 'none';
    }

    document.querySelector('#prop-oracle').onkeyup = evt => {
        var ast = checkInput();

        if (ast === null) {
            clearAST(); clearTruthTable();
            return;
        }
        if (document.querySelector('#show-tt').checked) {
            updateTruthTable(ast);
        }
        if (document.querySelector('#show-ast').checked) {
            updateAST(ast);
        }
    }

    document.querySelector('#show-tt').onclick = evt => {
        (evt.target.checked) ? updateTruthTable() : clearTruthTable();
    }

    document.querySelector('#show-ast').onclick = evt => {
        (evt.target.checked) ? updateAST() : clearAST();
    }


    document.querySelector('#apply-oracle').onclick = evt => {
        var name = document.querySelector('#oracle-name').value;
        if (!name) {
            alert('Please specify circuit name!');
            return;
        }

        if (!!app.workspace.gates[name]) {
            overwrite = confirm("Circuit " + name + " already exists. Overwrite?");
            if (!overwrite) return;
        }

        var ast = checkInput();

        if (ast === null) return;

        var arity = zhegalkin.getMaxVar(ast);
        var nqubits = arity + 1;
        var ttargs = zhegalkin.constructTT(arity);
        // construct last columnt of truth table;
        var ttc = ttargs.map(args => {
            return zhegalkin.evaluate(ast, args);
        })

        var side = document.querySelector('#oracle-variant').value, gates;
        if (side == 'left') {
            gates = zhegalkin.constructCircuit(ttc, true);
        } else if (side == 'right')  {
            gates = zhegalkin.constructCircuit(ttc, false);
        } else {
            gates = zhegalkin.compareCircuits
            (
                zhegalkin.constructCircuit(ttc, false),
                zhegalkin.constructCircuit(ttc, true)
            );
        }
        gates = gates.sort((a, b) => a.time - b.time);

        var circuit = Circuit.load(app, nqubits, gates);
        circuit.inputs = new Array(nqubits).fill(0);

        const size = Math.pow(2, nqubits);
        const U = new numeric.T(numeric.identity(size), numeric.rep([size, size], 0));
        app.applyCircuit(circuit, U, U => {
            if (app.workspace.gates[name]) {
                app.workspace.gates[name].matrix = U;
                app.workspace.gates[name].circuit = circuit.copy();
                app.workspace.gates[name].nqubits = circuit.nqubits;
                app.workspace.gates[name].input = circuit.inputs;
            } else {
                app.workspace.addGate({
                    name: name,
                    qubits: circuit.nqubits,
                    matrix: U,
                    circuit: circuit.copy(),
                    input: circuit.inputs
                });
            }

            app.editCircuit(app.workspace.gates[name]);
            var active = document.querySelector('.gate.active');
            if (active) {
                active.classList.remove('active');
            }

            Array.from(document.querySelectorAll('.gate'))
                 .find(elem => elem.dataset.type == name).classList.add('active');

            document.querySelector('#oraclegen-container').style.display = 'none';
            document.querySelector('#modal').style.display = 'none';

            runAssertions(circuit, ast);
        });
    }
};
