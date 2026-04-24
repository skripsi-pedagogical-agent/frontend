import React, { useCallback, useEffect, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import { PYTHON_BUILTINS } from "@/src/lib/pythonCompletions";

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

      completionProviderRef.current =
        monaco.languages.registerCompletionItemProvider(language, {
          triggerCharacters: [
            ".",
            "_",
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l",
            "m",
            "n",
            "o",
            "p",
            "q",
            "r",
            "s",
            "t",
            "u",
            "v",
            "w",
            "x",
            "y",
            "z",
          ],
          provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const prefix = word.word.toLowerCase();
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            // Filter suggestions from PYTHON_BUILTINS based on prefix
            const filtered = PYTHON_BUILTINS.filter((item) =>
              item.label.toLowerCase().startsWith(prefix),
            ).map((item) => ({
              ...item,
              range,
            }));

            return {
              suggestions: filtered,
            };
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
