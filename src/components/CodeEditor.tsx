import React, { useCallback, useEffect, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language = "python",
  readOnly = false,
}) => {
  const completionProviderRef = useRef<{ dispose: () => void } | null>(null);

  const registerCompletionProvider = useCallback(
    (monaco: Monaco) => {
      completionProviderRef.current?.dispose();

      completionProviderRef.current = monaco.languages.registerCompletionItemProvider(
        language,
        {
          triggerCharacters: [".", "_"],
          provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            return {
              suggestions: [
                {
                  label: "def",
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertText: "def ${1:function_name}(${2:args}):\n\t${3:pass}",
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: "Define a function",
                  range,
                },
                {
                  label: "class",
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertText:
                    "class ${1:ClassName}:\n\tdef __init__(self, ${2:args}):\n\t\t${3:pass}",
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: "Define a class",
                  range,
                },
                {
                  label: "if",
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertText: "if ${1:condition}:\n\t${2:pass}",
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: "Conditional block",
                  range,
                },
                {
                  label: "for",
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertText: "for ${1:item} in ${2:iterable}:\n\t${3:pass}",
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: "For loop",
                  range,
                },
                {
                  label: "while",
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertText: "while ${1:condition}:\n\t${2:pass}",
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: "While loop",
                  range,
                },
                {
                  label: "return",
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: "return ",
                  documentation: "Return from function",
                  range,
                },
                {
                  label: "print",
                  kind: monaco.languages.CompletionItemKind.Function,
                  insertText: "print(${1:value})",
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: "Print output to console",
                  range,
                },
              ],
            };
          },
        },
      );
    },
    [language],
  );

  useEffect(() => {
    return () => {
      completionProviderRef.current?.dispose();
      completionProviderRef.current = null;
    };
  }, []);

  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden border border-emerald-100 shadow-sm bg-[#1e1e1e]"
      style={{ contain: "strict" }}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        beforeMount={registerCompletionProvider}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineNumbers: "on",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          cursorBlinking: "smooth",
          smoothScrolling: true,
          contextmenu: true,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
};
