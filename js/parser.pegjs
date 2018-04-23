Expression
  = head:Term tail:(_ ("|" / '+') _ Term)* {
      return tail.reduce(function(result, element) {
        return [element[1], result, element[3]]
      }, head);
    }

Not
  = "-" e:Expression { return ["-", e] }

Term
  = head:Factor tail:(_ ("&") _ Factor)* {
      return tail.reduce(function(result, element) {
        return [element[1], result, element[3]]
      }, head);
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / not:Not{ return not; }
  / Integer

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
