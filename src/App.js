import './App.css';
import {useEffect} from "react"
import {EditorState, TextSelection} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, DOMParser} from "prosemirror-model"
import { keymap } from "prosemirror-keymap";
import { baseKeymap, newlineInCode, createParagraphNear, liftEmptyBlock, splitBlockKeepMarks } from "prosemirror-commands";

// This function is used to create a new section after the section in which the cursor is located.
// It is anticipated that this will be referred to by buttons, and keyboard commands.
function insertSectionAfterCurrentSection(state, dispatch) {
  // Find the parent node (section) of the current cursor position
  // Get the cursor location from the editor's state.
  const { $from } = state.selection;

  // Find the most immediate ancestor "section" element
  let depth = $from.depth;
  while ($from.node(depth).type.name !== "section") {
      depth--;
      if (depth < 0) {
          console.log("No parent section node found.");
          return false;
      }
  }

  // Insert the section node if requested to do so.
  if (dispatch) {
      // Find the position after the most immediate section parent
      const after = $from.after($from.depth - 1);
      // const after = $from.node(depth).after();

      // Create a new section
      const sectionNode = state.schema.nodes.section.createAndFill();
      // Create an insert transaction
      const tr = state.tr.insert(after, sectionNode);

      const $startOfNewSection = tr.doc.resolve(after + 3);
      const newSelection = TextSelection.create(tr.doc, $startOfNewSection.pos);
      
      // Set the new selection
      dispatch(tr.setSelection(newSelection));

      return true;
  }
}

// Create a new command for Enter key
// This should only check to see if the cursor is at the end of the last child of the parent section element,
// and if so, add a new section, otherwise do the default enter behaviour.
function enterCommand(state, dispatch) {

  // Find the parent node (section) of the current cursor position
  // Get the cursor location from the editor's state.
  const { $from } = state.selection;

  // Find the most immediate ancestor "section" element
  let depth = $from.depth;
  while ($from.node(depth).type.name !== "section") {
      depth--;
      if (depth < 0) {
          console.log("No parent section node found.");
      }
  }

  // Check if the cursor is at the end of the last child node
  if ($from.node(depth).parentOffset === $from.node(depth).content.size) {
    // If it is, insert a new section node
    return insertSectionAfterCurrentSection(state, dispatch);
  }
  // If the conditions are not met, use the default Enter behavior
  return newlineInCode(state, dispatch) ||
    createParagraphNear(state, dispatch) ||
    liftEmptyBlock(state, dispatch) ||
    splitBlockKeepMarks(state, dispatch);
}

// Add a keymap including our new command
const myKeymap = keymap({
  Enter: enterCommand,
  "Ctrl-Shift-1": insertSectionAfterCurrentSection,
  ...baseKeymap
});



function App() {
  useEffect( () => {

    const cleanSchema = new Schema({
      nodes: {
        doc: {
          content: "andoc"
        },
        andoc: {
          content: "act", 
          toDOM(node) {return ['AkomaNtoso', 0]},
          parseDOM: [{tag: "akomantoso"}]
        },
        act: {
          content: "body", 
          toDOM(node) {return ['act',0]},
          parseDOM: [{tag: "act"}]
        },
        body: {
          content: "title section+",
          toDOM(node) { return ['body',0]},
          parseDOM: [{tag: "body"}]
        },
        title: {
          content: "text*", 
          toDOM(node) {return ['title',0]},
          parseDOM: [{tag: "title"}]
        },
        heading: {
          content: "text*",
          toDOM(node) {return ['heading',0]},
          parseDOM: [{tag: "heading"}]
        },
        section: {
          content: "number heading? intro subsection* wrapup?",
          toDOM(node) {return ['section',0]},
          parseDOM: [{tag: "section"}]
        },
        subsection: {
          content: "number heading? intro paragraph* wrapup?",
          toDOM(node) {return ['subsection',0]},
          parseDOM: [{tag: "subsection"}]
        },
        paragraph: {
          content: "number intro subparagraph* wrapup?",
          toDOM(node) {return ['subsection',0]},
          parseDOM: [{tag: "subsection"}]
        },
        subparagraph: {
          content: "number intro",
          toDOM(node) {return ['subsection',0]},
          parseDOM: [{tag: "subsection"}]
        },
        intro: {
          content: "legaltext+",
          toDOM(node) { return ['intro',0]},
          parseDOM: [{tag: "intro"}]
        },
        wrapup: {
          content: "legaltext*",
          toDOM(node) {return ['wrapup',0]},
          parseDOM: [{tag: "wrapup"}]
        },
        number: {
          content: "text*",
          toDOM(node) { return ['num',0]},
          parseDOM: [{tag: "number"}]
        },
        legaltext: {
          content: "text*",
          toDOM(node) {return ['p',0]},
          parseDOM: [{tag: "p"}]
        },
        text: {},
      },
      marks: {}
    })
    
    window.view = new EditorView(document.querySelector("#editor"), {
      state: EditorState.create({
        doc: DOMParser.fromSchema(cleanSchema).parse(document.querySelector("#content")),
        plugins: [myKeymap],
      })
    })
    // document.querySelector("#insertSectionButton").addEventListener("click", function() {
    //   insertSectionAfterCurrentSection(window.view.state, window.view.dispatch);
    // });
  })
  return (
    <div className="App">
      <div id="editor"></div>
      <div id="content"></div>
      <p>Press `SHIFT-CTRL-1` to add additional sections.</p>
      <p>Demonstration of using <a href="https://prosemirror.net">ProseMirror</a> to generate <a href="http://www.akomantoso.org/">AkomaNtoso</a> by Lexpedite Legal Technology Ltd.</p>
    </div>
  );
}

export default App;
