{

function reduce (head, tail) {
      return tail.reduce(function(result, element) {
        return [element[1], result, element[3]]
      }, head);
}

}

Impl = head:Disj    tail:(_ ("->") _      Disj)* { return reduce (head, tail); }

Disj = head:Xor    tail:(_ ("|") _         Xor)* { return reduce (head, tail); }

Xor  = head:Conj   tail:(_ ('+') _        Conj)* { return reduce (head, tail); }

Conj = head:Factor tail:(_ ("&") _      Factor)* { return reduce (head, tail); }

Factor
  = "(" _ expr:Impl _ ")" { return expr; }
  / Not
  / Integer

Not = "-" e:Factor { return ["-", e] }

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
