// Cangaroo DSL Parser — hand-written recursive descent parser
// Supports: pas; dreapta; stanga; vopseste; sari;
// Loops: repetă (n) { ... }
// Conditionals: dacă (liber) { ... }

export type ASTNode =
  | { type: 'command'; name: string; line: number }
  | { type: 'loop'; count: number; body: ASTNode[]; line: number }
  | { type: 'conditional'; condition: string; body: ASTNode[]; line: number };

export interface ParseError {
  message: string;
  line: number;
  col: number;
}

interface Token {
  type: 'keyword' | 'number' | 'lparen' | 'rparen' | 'lbrace' | 'rbrace' | 'semicolon' | 'identifier' | 'eof';
  value: string;
  line: number;
  col: number;
}

const COMMANDS = ['pas', 'vopseste', 'sari', 'rotire_stinga', 'rotire_dreapta'];
const KEYWORDS = ['repeta', 'repetă', 'daca', 'dacă'];

function tokenize(source: string): { tokens: Token[], errors: ParseError[] } {
  const tokens: Token[] = [];
  const errors: ParseError[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  while (i < source.length) {
    const ch = source[i];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++; col++;
      continue;
    }
    if (ch === '\n') {
      i++; line++; col = 1;
      continue;
    }

    // Single-line comment
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }

    // Symbols
    if (ch === '(') { tokens.push({ type: 'lparen', value: '(', line, col }); i++; col++; continue; }
    if (ch === ')') { tokens.push({ type: 'rparen', value: ')', line, col }); i++; col++; continue; }
    if (ch === '{') { tokens.push({ type: 'lbrace', value: '{', line, col }); i++; col++; continue; }
    if (ch === '}') { tokens.push({ type: 'rbrace', value: '}', line, col }); i++; col++; continue; }
    if (ch === ';') { tokens.push({ type: 'semicolon', value: ';', line, col }); i++; col++; continue; }

    // Numbers
    if (/[0-9]/.test(ch)) {
      let num = '';
      const startCol = col;
      while (i < source.length && /[0-9]/.test(source[i])) {
        num += source[i]; i++; col++;
      }
      tokens.push({ type: 'number', value: num, line, col: startCol });
      continue;
    }

    // Identifiers / keywords (support Romanian diacritics)
    if (/[a-zA-Zăâîșțéèêë_]/.test(ch)) {
      let word = '';
      const startCol = col;
      while (i < source.length && /[a-zA-Z0-9ăâîșțéèêë_]/.test(source[i])) {
        word += source[i]; i++; col++;
      }
      const lower = word.toLowerCase();
      if (COMMANDS.includes(lower) || KEYWORDS.includes(lower) || lower === 'liber') {
        tokens.push({ type: 'keyword', value: lower, line, col: startCol });
      } else {
        tokens.push({ type: 'identifier', value: word, line, col: startCol });
      }
      continue;
    }

    // Unknown character
    errors.push({ message: `Caracter necunoscut: '${ch}'`, line, col });
    i++; col++;
  }

  tokens.push({ type: 'eof', value: '', line, col });
  return { tokens, errors };
}

export function parse(source: string): { ast: ASTNode[], errors: ParseError[] } {
  const { tokens, errors } = tokenize(source);
  let pos = 0;

  function current(): Token {
    return tokens[pos] || { type: 'eof', value: '', line: 0, col: 0 };
  }

  function advance(): Token {
    return tokens[pos++];
  }

  function expect(type: Token['type'], value?: string): Token {
    const tok = current();
    if (tok.type !== type || (value !== undefined && tok.value !== value)) {
      errors.push({
        message: `Se așteaptă '${value || type}', dar s-a găsit '${tok.value || tok.type}'`,
        line: tok.line,
        col: tok.col
      });
      // Create a synthetic token to continue parsing
      return { type, value: value || '', line: tok.line, col: tok.col };
    }
    return advance();
  }

  function parseBlock(): ASTNode[] {
    expect('lbrace');
    const body: ASTNode[] = [];
    while (current().type !== 'rbrace' && current().type !== 'eof') {
      const node = parseStatement();
      if (node) body.push(node);
    }
    if (current().type === 'rbrace') advance();
    return body;
  }

  function parseStatement(): ASTNode | null {
    const tok = current();

    // Command: pas; dreapta; etc.
    if (tok.type === 'keyword' && COMMANDS.includes(tok.value)) {
      advance();
      expect('semicolon');
      return { type: 'command', name: tok.value, line: tok.line };
    }

    // Loop: repetă (n) { ... }
    if (tok.type === 'keyword' && (tok.value === 'repeta' || tok.value === 'repetă')) {
      advance();
      expect('lparen');
      const countTok = expect('number');
      const count = parseInt(countTok.value) || 1;
      expect('rparen');
      const body = parseBlock();
      return { type: 'loop', count, body, line: tok.line };
    }

    // Conditional: dacă (liber) { ... }
    if (tok.type === 'keyword' && (tok.value === 'daca' || tok.value === 'dacă')) {
      advance();
      expect('lparen');
      const condTok = expect('keyword', 'liber');
      expect('rparen');
      const body = parseBlock();
      return { type: 'conditional', condition: condTok.value, body, line: tok.line };
    }

    // Unknown token — skip it and report error
    if (tok.type !== 'eof') {
      errors.push({
        message: `Instrucțiune necunoscută: '${tok.value}'`,
        line: tok.line,
        col: tok.col
      });
      advance();
    }
    return null;
  }

  const ast: ASTNode[] = [];
  while (current().type !== 'eof') {
    const node = parseStatement();
    if (node) ast.push(node);
  }

  return { ast, errors };
}
