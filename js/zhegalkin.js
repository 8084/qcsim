module.exports = {
    reduceWithXor: reduceWithXor,
    getTriangle: getTriangle,
    constructTT: constructTT
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
