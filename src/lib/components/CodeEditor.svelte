<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { parse } from '$lib/parser/parser';

  let { code = $bindable(''), onerror }: {
    code: string;
    onerror?: (errors: Array<{ message: string; line: number; col: number }>) => void;
  } = $props();

  let editorContainer: HTMLDivElement;
  let editorView: any = null;

  onMount(async () => {
    const { EditorState } = await import('@codemirror/state');
    const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } = await import('@codemirror/view');
    const { defaultKeymap, history, historyKeymap } = await import('@codemirror/commands');
    const { syntaxHighlighting, HighlightStyle, StreamLanguage } = await import('@codemirror/language');
    const { tags } = await import('@lezer/highlight');
    const { autocompletion } = await import('@codemirror/autocomplete');
    const lintModule = await import('@codemirror/lint');
    const linter = lintModule.linter;

    // Custom DSL language definition using StreamLanguage
    const cangarooDSL = StreamLanguage.define({
      token(stream) {
        // Skip whitespace
        if (stream.eatSpace()) return null;

        // Comments
        if (stream.match('//')) {
          stream.skipToEnd();
          return 'comment';
        }

        // Numbers
        if (stream.match(/^[0-9]+/)) {
          return 'number';
        }

        // Keywords and commands
        if (stream.match(/^(repetă|repeta|dacă|daca)\b/)) {
          return 'keyword';
        }
        if (stream.match(/^(pas|vopseste|sari|rotire_stinga|rotire_dreapta)\b/)) {
          return 'atom'; // commands
        }
        if (stream.match(/^liber\b/)) {
          return 'variableName';
        }

        // Braces and parens
        if (stream.match(/^[{}()]/)) {
          return 'bracket';
        }

        // Semicolons
        if (stream.eat(';')) {
          return 'punctuation';
        }

        // Any other character
        stream.next();
        return 'invalid';
      }
    });

    // Cyberpunk syntax highlighting theme
    const cyberHighlight = HighlightStyle.define([
      { tag: tags.keyword, color: '#22d3ee', fontWeight: 'bold' },
      { tag: tags.atom, color: '#e879f9' },
      { tag: tags.number, color: '#a3e635' },
      { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
      { tag: tags.bracket, color: '#94a3b8' },
      { tag: tags.punctuation, color: '#64748b' },
      { tag: tags.variableName, color: '#fbbf24' },
      { tag: tags.invalid, color: '#f87171' }
    ]);

    // Cyberpunk editor theme
    const cyberTheme = EditorView.theme({
      '&': {
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        color: '#e2e8f0',
        fontSize: '14px',
        fontFamily: "'JetBrains Mono', monospace",
        borderRadius: '8px',
        height: '100%'
      },
      '.cm-content': {
        caretColor: '#22d3ee',
        padding: '12px 0'
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: '#22d3ee',
        borderLeftWidth: '2px'
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(34, 211, 238, 0.2) !important'
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(34, 211, 238, 0.15) !important'
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(34, 211, 238, 0.05)'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(34, 211, 238, 0.08)'
      },
      '.cm-gutters': {
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        color: '#475569',
        border: 'none',
        borderRight: '1px solid rgba(34, 211, 238, 0.1)'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 12px',
        minWidth: '32px'
      },
      '.cm-tooltip.cm-tooltip-autocomplete': {
        backgroundColor: '#0f172a',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        borderRadius: '6px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      },
      '.cm-tooltip-autocomplete ul li': {
        padding: '4px 12px',
        color: '#e2e8f0'
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        color: '#22d3ee'
      },
      '.cm-diagnostic-error': {
        borderBottom: '2px wavy #f87171'
      }
    });

    // Autocompletion for DSL commands
    const dslCompletions = autocompletion({
      override: [
        (context) => {
          const word = context.matchBefore(/\w*/);
          if (!word || (word.from === word.to && !context.explicit)) return null;

          return {
            from: word.from,
            options: [
              { label: 'pas', type: 'function', detail: 'Fă un pas înainte', apply: 'pas;' },
              { label: 'rotire_dreapta', type: 'function', detail: 'Viraj la dreapta', apply: 'rotire_dreapta;' },
              { label: 'rotire_stinga', type: 'function', detail: 'Viraj la stânga', apply: 'rotire_stinga;' },
              { label: 'vopseste', type: 'function', detail: 'Vopsește celula curentă', apply: 'vopseste;' },
              { label: 'sari', type: 'function', detail: 'Sari peste o celulă', apply: 'sari;' },
              { label: 'repetă', type: 'keyword', detail: 'Buclă de repetare', apply: 'repetă () {\n  \n}' },
              { label: 'dacă', type: 'keyword', detail: 'Condiție', apply: 'dacă (liber) {\n  \n}' },
              { label: 'liber', type: 'variable', detail: 'Verifică dacă calea e liberă' }
            ]
          };
        }
      ]
    });

    // Real-time lint checking
    const dslLinter = linter((view) => {
      const doc = view.state.doc.toString();
      const { errors } = parse(doc);
      const diagnostics: any[] = [];

      for (const err of errors) {
        const line = view.state.doc.line(Math.min(err.line, view.state.doc.lines));
        const from = line.from + Math.max(0, err.col - 1);
        const to = Math.min(from + 10, line.to);
        diagnostics.push({
          from,
          to,
          severity: 'error',
          message: err.message
        });
      }

      return diagnostics;
    });

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        cangarooDSL,
        syntaxHighlighting(cyberHighlight),
        cyberTheme,
        dslCompletions,
        dslLinter,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            code = update.state.doc.toString();
          }
        })
      ]
    });

    editorView = new EditorView({
      state,
      parent: editorContainer
    });
  });

  onDestroy(() => {
    if (editorView) {
      editorView.destroy();
    }
  });
</script>

<div class="editor-wrapper" id="code-editor">
  <div class="editor-header">
    <div class="editor-dot red"></div>
    <div class="editor-dot yellow"></div>
    <div class="editor-dot green"></div>
    <span class="editor-title">cangaroo.dsl</span>
  </div>
  <div bind:this={editorContainer} class="editor-container"></div>
</div>

<style>
  .editor-wrapper {
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 12px;
    overflow: hidden;
    background: rgba(2, 6, 23, 0.8);
    box-shadow:
      0 0 15px rgba(34, 211, 238, 0.08),
      inset 0 0 30px rgba(0, 0, 0, 0.2);
    height: 100%;
  }

  .editor-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(34, 211, 238, 0.1);
  }

  .editor-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .editor-dot.red { background: #ef4444; }
  .editor-dot.yellow { background: #eab308; }
  .editor-dot.green { background: #22c55e; }

  .editor-title {
    margin-left: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: #64748b;
    letter-spacing: 0.05em;
  }

  .editor-container {
    flex: 1;
    overflow: auto;
    min-height: 200px;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }

  .editor-container :global(.cm-scroller) {
    overflow: auto;
  }
</style>
