# Preview: Noted-style Editor (feat/noted-style-editor)

This PR adds an initial preview implementation of a Noted iOS-like note editor for web.

What this preview includes:
- Dark-mode first design styled to match Noted iOS aesthetic.
- Uses system iOS font stack (San Francisco via -apple-system) as default; font picker with serif/mono.
- Formatting toolbar: Bold, Italic, Underline, Strikethrough.
- Headings H1/H2/H3.
- Bulleted / Numbered lists.
- Blockquote and Code block.
- Text color and highlight pickers.
- Font size slider (12–32px) and line-height presets.
- Keyboard accessory toolbar (sticky at bottom of editor area) for quick actions.
- Live preview toggle and autosave to localStorage (debounced).
- Preview page at /editor for manual testing.

Caveats / Notes:
- Current implementation uses contentEditable + document.execCommand for rapid preview. execCommand is deprecated and has limitations across browsers.
- For production-grade behavior (clean HTML, undo stack, collaborative editing), I recommend migrating to a modern editor framework (TipTap / ProseMirror, Lexical, or Slate).
- I can push this preview to branch feat/noted-style-editor and open a PR with screenshots. After your review, I'll iterate and replace contentEditable with a robust rich-text engine if you want.

If you approve, I will:
1. Push the files to branch feat/noted-style-editor.
2. Open a PR and attach screenshots / animated GIF of the editor in dark mode.
3. Continue with accessibility improvements, keyboard shortcuts, and integrate autosave with backend storage (if desired).