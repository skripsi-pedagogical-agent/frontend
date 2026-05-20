import React, { useCallback, useEffect, useRef } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { PYTHON_BUILTINS } from "@/src/lib/pythonCompletions";

type EditorInstance = Parameters<OnMount>[0];

interface CodeEditorProps {
  defaultValue: string;
  onChange: (value: string | undefined) => void;
  onMount?: (editor: EditorInstance) => void;
  language?: string;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = React.memo(({
  defaultValue,
  onChange,
  onMount,
  language = "python",
  readOnly = false,
}) => {
  const completionProviderRef = useRef<{ dispose: () => void } | null>(null);

  const registerCompletionProvider = useCallback(
    (monaco: Monaco) => {
      completionProviderRef.current?.dispose();

      completionProviderRef.current =
        monaco.languages.registerCompletionItemProvider(language, {
          triggerCharacters: [".", "_"],
          provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const prefix = word.word.toLowerCase();
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            const filtered = PYTHON_BUILTINS.filter((item) =>
              item.label.toLowerCase().startsWith(prefix),
            ).map((item) => ({
              ...item,
              range,
            }));

            return { suggestions: filtered };
          },
        });
    },
    [language],
  );

  useEffect(() => {
    return () => {
      completionProviderRef.current?.dispose();
      completionProviderRef.current = null;
    };
  }, []);

  const defineTheme = useCallback((monaco: Monaco) => {
    registerCompletionProvider(monaco);
    monaco.editor.defineTheme("emerald-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0a1a10",
        "editor.lineHighlightBackground": "#0f2418",
        "editorLineNumber.foreground": "#2d5a3a",
        "editorLineNumber.activeForeground": "#4ade80",
        "editorGutter.background": "#0a1a10",
        "editorCursor.foreground": "#4ade80",
        "editor.selectionBackground": "#1a4a28",
        "editor.inactiveSelectionBackground": "#152a1c",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "#1a3020aa",
        "scrollbarSlider.hoverBackground": "#1e3a26cc",
        "scrollbarSlider.activeBackground": "#244830",
      },
    });
  }, [registerCompletionProvider]);

  const handleMount = useCallback<OnMount>((editor) => {
    onMount?.(editor);
  }, [onMount]);

  return (
    <div
      className="w-full h-full overflow-hidden shadow-sm bg-[#0a1a10]"
      style={{ contain: "strict" }}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        beforeMount={defineTheme}
        defaultValue={defaultValue}
        onChange={onChange}
        onMount={handleMount}
        theme="emerald-dark"
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
});
