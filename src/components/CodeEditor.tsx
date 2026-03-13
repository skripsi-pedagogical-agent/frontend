import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language = 'python' }) => {
  return (
    <div 
      className="w-full h-full rounded-xl overflow-hidden border border-emerald-100 shadow-sm bg-[#1e1e1e]"
      style={{ contain: 'strict' }}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          contextmenu: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
};