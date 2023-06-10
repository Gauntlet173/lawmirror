import './App.css';
import {useEffect} from "react"
import {EditorState, TextSelection, NodeSelection} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, DOMParser} from "prosemirror-model"
import { keymap } from "prosemirror-keymap";
import { baseKeymap, newlineInCode, createParagraphNear, liftEmptyBlock, splitBlockKeepMarks } from "prosemirror-commands";
import applyDevTools from "prosemirror-dev-tools";
import {undo, redo, history } from "prosemirror-history";

function createSpanFromSelectedText(state, dispatch) {
  // Get the span mark type from the schema
  const span = state.schema.nodes.span;
  
  const { from, to } = state.selection;

  // Get the selected text
  let selectedText = state.doc.textBetween(from, to);

  // Create a new span node with the selected text as its content
  let spanNode = span.create(null, state.schema.text(selectedText));

  // Create a transaction that replaces the selected text with the span node
  let tr = state.tr.replaceWith(from, to, spanNode);


  // Check if the transaction is valid before dispatching
  if (dispatch) {
    dispatch(tr);
    return true;
  }
}

function insertSubparagraphInCurrentParagraph(state,dispatch) {
  // Figure out what section or subsection we are in.
  const { $from } = state.selection;

  // Find the most immediate ancestor "section" or "subsection" element
  let depth = $from.depth;
  while ($from.node(depth).type.name !== "paragraph") {
      depth--;
      if (depth < 0) {
          console.log("No parent paragraph node found.");
          return false;
      }
  }
  // Add a header to it.
  if (dispatch) {
      const after = $from.after($from.depth - 1);
          
      const subparagraphNode = state.schema.nodes.subparagraph.createAndFill();
      // Create an insert transaction
      const tr = state.tr.insert(after, subparagraphNode);

      const $startOfNewSubparagraph = tr.doc.resolve(after + 1);
      const newSelection = TextSelection.create(tr.doc, $startOfNewSubparagraph.pos);
      
      // Set the new selection
      dispatch(tr.setSelection(newSelection));

      return true;
  }
}

function insertWrapupInCurrentSectionOrSubSectionOrParagraph(state,dispatch) {
  // Figure out what section or subsection we are in.
  const { $from } = state.selection;

  // Find the most immediate ancestor "section" or "subsection" or "paragraph" element
  let depth = $from.depth;
  while ($from.node(depth).type.name !== "section" && $from.node(depth).type.name !== "subsection" && $from.node(depth).type.name !== "paragraph" ) {
      depth--;
      if (depth < 0) {
          console.log("No parent paragraph or subsection or section node found.");
          return false;
      }
  }
  // Add a header to it.
  if (dispatch) {
      const after = $from.after($from.depth - 1);
          
      const wrapupNode = state.schema.nodes.wrapup.createAndFill();
      // Create an insert transaction
      const tr = state.tr.insert(after, wrapupNode);

      const $startOfNewWrapup = tr.doc.resolve(after + 1);
      const newSelection = TextSelection.create(tr.doc, $startOfNewWrapup.pos);
      
      // Set the new selection
      dispatch(tr.setSelection(newSelection));

      return true;
  }
}

function insertParagraphInCurrentSectionOrSubSection(state,dispatch) {
  // Figure out what section or subsection we are in.
  const { $from } = state.selection;

  // Find the most immediate ancestor "section" or "subsection" element
  let depth = $from.depth;
  while ($from.node(depth).type.name !== "section" && $from.node(depth).type.name !== "subsection") {
      depth--;
      if (depth < 0) {
          console.log("No parent subsection or section node found.");
          return false;
      }
  }
  // Add a header to it.
  if (dispatch) {
      const after = $from.after($from.depth - 1);
          
      const paragraphNode = state.schema.nodes.paragraph.createAndFill();
      // Create an insert transaction
      const tr = state.tr.insert(after, paragraphNode);

      const $startOfNewParagraph = tr.doc.resolve(after + 1);
      const newSelection = TextSelection.create(tr.doc, $startOfNewParagraph.pos);
      
      // Set the new selection
      dispatch(tr.setSelection(newSelection));

      return true;
  }
}

function insertHeaderInCurrentSectionOrSubSection(state, dispatch) {
  // Figure out what section or subsection we are in.
  const { $from } = state.selection;

  // Find the most immediate ancestor "section" or "subsection" element
  let depth = $from.depth;
  while ($from.node(depth).type.name !== "section" && $from.node(depth).type.name !== "subsection") {
      depth--;
      if (depth < 0) {
          console.log("No parent subsection or section node found.");
          return false;
      }
  }
  // Add a header to it.
  if (dispatch) {

      let sectionNode = $from.node(depth);
      let heading = state.schema.nodes.heading.create({}, state.schema.text(''));
      let contentArray = [heading];

      // Append each child node from the original section to the array
      sectionNode.forEach(child => contentArray.push(child.copy(child.content)));

      let newSectionNode = sectionNode.type.create(sectionNode.attrs, contentArray);
      let tr = state.tr.replaceWith($from.before(depth), $from.after(depth), newSectionNode);
      
      dispatch(tr);

      return true;

  }
}

function insertSubsectionInCurrentSection(state, dispatch) {
  // Figure out what section we are in.
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
  // Append a subsection to it.
  if (dispatch) {
      const after = $from.after($from.depth - 1);
      
      const subsectionNode = state.schema.nodes.subsection.createAndFill();
      // Create an insert transaction
      const tr = state.tr.insert(after, subsectionNode);

      const $startOfNewSubsection = tr.doc.resolve(after + 3);
      const newSelection = TextSelection.create(tr.doc, $startOfNewSubsection.pos);
      
      // Set the new selection
      dispatch(tr.setSelection(newSelection));

      return true;
  }
}

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
  "Enter": enterCommand,
  "Ctrl-Shift-1": insertSectionAfterCurrentSection,
  "Ctrl-Shift-2": insertSubsectionInCurrentSection,
  "Ctrl-Shift-3": insertParagraphInCurrentSectionOrSubSection,
  "Ctrl-Shift-4": insertSubparagraphInCurrentParagraph,
  //"Ctrl-Shift-W": insertWrapupInCurrentSectionOrSubSectionOrParagraph,
  "Ctrl-Shift-H": insertHeaderInCurrentSectionOrSubSection,
  "Ctrl-Shift-S": createSpanFromSelectedText,
  "Ctrl-Z": undo,
  "Ctrl-Y": redo,
  ...baseKeymap
});



function App() {
  useEffect( () => {

    const cleanSchema = new Schema({
      nodes: {
        doc: {
          content: "andoc",
          marks: ""
        },
        andoc: {
          content: "act",
          attrs: { id: {default: "akomaNtosoElement"}, class: {default: "an debug"} },
          toDOM(node) {return ['akomantoso',{ id: node.attrs.id, class: node.attrs.class }, 0]},
          parseDOM: [{tag: "akomantoso", getAttrs(dom) {return {id: dom.getAttribute("id"), class: dom.getAttribute("class")}}}],
          marks: ""
        },
        act: {
          content: "body", 
          toDOM(node) {return ['act',0]},
          parseDOM: [{tag: "act"}],
          marks: ""
        },
        body: {
          content: "title section+",
          toDOM(node) { return ['body',0]},
          parseDOM: [{tag: "body"}],
          marks: ""
        },
        title: {
          content: "text*", 
          toDOM(node) {return ['title',0]},
          parseDOM: [{tag: "title"}],
          marks: ""
        },
        heading: {
          content: "text*",
          toDOM(node) {return ['heading',0]},
          parseDOM: [{tag: "heading"}],
          marks: ""
        },
        section: {
          content: "heading? number intro (subsection* | paragraph*) wrapup?",
          toDOM(node) {return ['section',0]},
          parseDOM: [{tag: "section"}],
          marks: ""
        },
        subsection: {
          content: "heading? number intro paragraph* wrapup?",
          toDOM(node) {return ['subsection',0]},
          parseDOM: [{tag: "subsection"}],
          marks: ""
        },
        paragraph: {
          content: "number intro subparagraph* wrapup?",
          toDOM(node) {return ['paragraph',0]},
          parseDOM: [{tag: "paragraph"}],
          marks: ""
        },
        subparagraph: {
          content: "number intro",
          toDOM(node) {return ['subparagraph',0]},
          parseDOM: [{tag: "subparagraph"}],
          marks: ""
        },
        intro: {
          content: "legaltext+",
          toDOM(node) { return ['intro',0]},
          parseDOM: [{tag: "intro"}],
          marks: ""
        },
        wrapup: {
          content: "legaltext+",
          toDOM(node) {return ['wrapup',0]},
          parseDOM: [{tag: "wrapup"}],
          marks: ""
        },
        number: {
          content: "text*",
          toDOM(node) { return ['num',0]},
          parseDOM: [{tag: "number"}],
          marks: ""
        },
        legaltext: {
          content: "text*",
          toDOM(node) {return ['p',0]},
          parseDOM: [{tag: "p"}],
          marks: ""
        },
        span: {
          content: "text*",
          inline: true,
          attrs: { id: {default: ""}},
          toDOM(node) {return['span',{ id: node.attrs.id},0]},
          parseDOM: [{tag: "span", getAttrs(dom) {return {id: dom.getAttribute("id")}}}],
          marks: ""
        },
        text: { marks: ""},
      },
      marks: {}
    })
    
    window.view = new EditorView(document.querySelector("#editor"), {
      state: EditorState.create({
        //doc: DOMParser.fromSchema(cleanSchema).parse(document.querySelector("#content")),
        plugins: [myKeymap, history()],
        schema: cleanSchema,
      })
    })
    
    document.getElementById("toggle-debug").addEventListener('click', () => {
      let tr = window.view.state.tr;
      window.view.state.doc.descendants((node, pos) => {
        if (node.attrs.id === "akomaNtosoElement") {
          let newAttrs = {...node.attrs};
          if(newAttrs.class.includes("debug")){
            // Remove "debug" class
            newAttrs.class = newAttrs.class.replace('debug', '').trim();
          } else {
            // Add "debug" class
            newAttrs.class = (newAttrs.class + " debug").trim();
          }
          tr.setNodeMarkup(pos, null, newAttrs);
          window.view.dispatch(tr);
        }
      });
      
    });

    document.getElementById("select-parent").addEventListener("click", function() {
      let { state, dispatch } = window.view;
      
      // Get the current selection
      let { $from } = state.selection;
    
      // Do nothing if we're at the top level of the document
      if ($from.depth < 2) return;
    
      // Find the position of the parent node
      let parentPos = $from.before($from.depth - 1);
    
      // Create a new NodeSelection on the parent node
      let selection = NodeSelection.create(state.doc, parentPos);
    
      // Create a new transaction that updates the selection
      let tr = state.tr.setSelection(selection);
    
      // Dispatch the transaction
      dispatch(tr);
    });

    document.getElementById("insert-section").addEventListener("click", function() {
      let { state, dispatch } = window.view;
      insertSectionAfterCurrentSection(state,dispatch);
    }
    );

    document.getElementById("insert-subsection").addEventListener("click", function() {
      let { state, dispatch } = window.view;
      insertSubsectionInCurrentSection(state,dispatch);
    }
    );

    document.getElementById("insert-header").addEventListener("click", function() {
      let { state,dispatch } = window.view;
      insertHeaderInCurrentSectionOrSubSection(state,dispatch);
    });

    document.getElementById("insert-paragraph").addEventListener("click", function() {
      let { state,dispatch } = window.view;
      insertParagraphInCurrentSectionOrSubSection(state,dispatch);
    });

    document.getElementById("insert-subparagraph").addEventListener("click", function() {
      let { state,dispatch } = window.view;
      insertSubparagraphInCurrentParagraph(state,dispatch);
    });

    document.getElementById("insert-wrapup").addEventListener("click", function() {
      let { state,dispatch } = window.view;
      insertWrapupInCurrentSectionOrSubSectionOrParagraph(state,dispatch);
    });
    
    document.getElementById("insert-span").addEventListener("click", function() {
      let { state,dispatch } = window.view;
      createSpanFromSelectedText(state,dispatch);
    });

    applyDevTools(window.view);

  })
  return (
    <div className="App">
      <div id="editor"></div>
      <button id="select-parent">Select Parent Node</button>
      <button id="toggle-debug">Toggle Debug</button>
      <button id="insert-section">Insert Section</button>
      <button id="insert-subsection">Insert Subsection</button>
      <button id="insert-header">Insert Header</button>
      <button id="insert-paragraph">Insert Paragraph</button>
      <button id="insert-subparagraph">Insert Subaragraph</button>
      <button id="insert-wrapup">Insert Wrapup</button>
      <button id="insert-span">Insert Span</button>
      <p>Keyboard Shortcuts:</p>
      <dl><dt>Ctrl-Shift-1</dt><dd>Add Section</dd>
      <dt>Ctrl-Shift-2</dt><dd>Add Subsection</dd>
      <dt>Ctrl-Shift-3</dt><dd>Add Paragraph</dd>
      <dt>Ctrl-Shift-4</dt><dd>Add Subparagraph</dd>
      <dt>Ctrl-Shift-H</dt><dd>Add Header</dd>
      <dt>Ctrl-Shift-S</dt><dd>Add Span</dd>
      </dl>
      <p>Demonstration of using <a href="https://prosemirror.net">ProseMirror</a> to generate <a href="http://www.akomantoso.org/">AkomaNtoso</a> by Lexpedite Legal Technology Ltd.</p>
    </div>
  );
}


export default App;
