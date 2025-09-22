import React, { useEffect, useRef, useState } from "react";
import "./noted-editor.css";

type FontPreset = {
  id: string;
  label: string;
  fontFamily: string;
};

const FONT_PRESETS: FontPreset[] = [
  { id: "sf-sans", label: "San Francisco (System)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" },
  { id: "serif", label: "Serif", fontFamily: "Georgia, 'Times New Roman', Times, serif" },
  { id: "mono", label: "Monospace", fontFamily: "Menlo, Monaco, 'Courier New', monospace" },
];

function debounce(fn: Function, delay = 400) {
  let t: any;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export default function NotedEditor() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState<string>("<p></p>");
  const [isPreview, setIsPreview] = useState(false);
  const [fontPreset, setFontPreset] = useState<string>(FONT_PRESETS[0].id);
  const [fontSize, setFontSize] = useState<number>(16);
  const [lineHeight, setLineHeight] = useState<number>(1.5);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Autosave to localStorage as preview autosave (replace with API call if wanted)
  const autosave = debounce((content: string) => {
    localStorage.setItem("aksara:note:preview", content);
    setLastSavedAt(new Date().toISOString());
  }, 600);

  useEffect(() => {
    const saved = localStorage.getItem("aksara:note:preview");
    if (saved) {
      setHtml(saved);
      if (editorRef.current) editorRef.current.innerHTML = saved;
    }
    // Apply dark mode class to body for editor preview
    document.documentElement.classList.toggle("aksara-dark", darkMode);
    return () => {};
  }, []); // run once

  useEffect(() => {
    // keep editor style in sync
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${fontSize}px`;
      editorRef.current.style.lineHeight = `${lineHeight}`;
      const preset = FONT_PRESETS.find((p) => p.id === fontPreset);
      if (preset) editorRef.current.style.fontFamily = preset.fontFamily;
    }
  }, [fontSize, lineHeight, fontPreset]);

  function exec(format: string, value?: string) {
    document.execCommand(format, false, value);
    handleInput(); // update state & autosave
  }

  function handleInput() {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    setHtml(content);
    autosave(content);
  }

  function togglePreview() {
    setIsPreview((p) => !p);
  }

  function applyHeading(level: number) {
    exec("formatBlock", `h${level}`);
  }

  function applyCodeBlock() {
    // simple code block wrapper
    exec("formatBlock", "pre");
    // add monospace font to pre
    const sel = window.getSelection();
    if (!sel) return;
    const node = sel.anchorNode?.parentElement;
    if (node && node.tagName.toLowerCase() === "pre") {
      (node as HTMLElement).style.fontFamily = FONT_PRESETS.find(p => p.id === "mono")!.fontFamily;
      (node as HTMLElement).style.background = "rgba(0,0,0,0.06)";
      (node as HTMLElement).style.padding = "8px";
      (node as HTMLElement).style.borderRadius = "6px";
    }
    handleInput();
  }

  function setColor(color: string) {
    exec("foreColor", color);
  }

  function setHighlight(color: string) {
    // backgroundColor via hiliteColor (some browsers) or apply span
    try {
      exec("hiliteColor", color);
    } catch {
      exec("backColor", color);
    }
  }

  function setList(ordered: boolean) {
    exec(ordered ? "insertOrderedList" : "insertUnorderedList");
  }

  return (
    <div className={`aksara-noted-wrapper ${darkMode ? "dark" : "light"}`}> 
      <div className="aksara-editor-header">
        <div className="left">
          <button onClick={() => setDarkMode(d => !d)} className="ghost">
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
        <div className="right">
          <button onClick={togglePreview} className="ghost">
            {isPreview ? "Edit" : "Live Preview"}
          </button>
          <div className="saved">Autosave: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : "—"}</div>
        </div>
      </div>

      <div className="aksara-toolbar">
        <div className="group">
          <select value={fontPreset} onChange={(e) => setFontPreset(e.target.value)}>
            {FONT_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>

          <div className="font-size">
            <label>Size</label>
            <input type="range" min={12} max={32} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
            <span className="px">{fontSize}px</span>
          </div>

          <div className="line-height">
            <label>Line</label>
            <select value={String(lineHeight)} onChange={(e) => setLineHeight(Number(e.target.value))}>
              <option value="1.2">1.2</option>
              <option value="1.5">1.5</option>
              <option value="1.8">1.8</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>

        <div className="group actions">
          <button onClick={() => exec("bold")} title="Bold"><b>B</b></button>
          <button onClick={() => exec("italic")} title="Italic"><i>I</i></button>
          <button onClick={() => exec("underline")} title="Underline"><u>U</u></button>
          <button onClick={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></button>

          <div className="divider" />

          <button onClick={() => applyHeading(1)} title="H1">H1</button>
          <button onClick={() => applyHeading(2)} title="H2">H2</button>
          <button onClick={() => applyHeading(3)} title="H3">H3</button>

          <div className="divider" />

          <button onClick={() => setList(false)} title="Bulleted">• List</button>
          <button onClick={() => setList(true)} title="Numbered">1. List</button>

          <div className="divider" />

          <button onClick={() => applyCodeBlock()} title="Code">{"</>"}</button>
          <button onClick={() => exec("formatBlock", "blockquote")} title="Blockquote">❝</button>

          <div className="divider" />

          <input type="color" onChange={(e) => setColor(e.target.value)} title="Text color" />
          <input type="color" onChange={(e) => setHighlight(e.target.value)} title="Highlight" />
        </div>
      </div>

      <div className="aksara-editor-area">
        {!isPreview ? (
          <>
            <div
              ref={editorRef}
              className="aksara-editor"
              contentEditable
              onInput={handleInput}
              suppressContentEditableWarning
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                fontFamily: FONT_PRESETS.find(p => p.id === fontPreset)!.fontFamily,
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <div className="keyboard-accessory">
              <button onClick={() => exec("bold")}>B</button>
              <button onClick={() => exec("italic")}>I</button>
              <button onClick={() => exec("underline")}>U</button>
              <button onClick={() => exec("insertUnorderedList")}>•</button>
              <button onClick={() => exec("insertOrderedList")}>1.</button>
            </div>
          </>
        ) : (
          <div className="aksara-preview" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  );
}