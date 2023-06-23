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
  console.log("From: " + from);
  console.log("To: " + to);

  // Get the selected text
  let selectedText = state.doc.textBetween(from, to);
  console.log("Selected text: " + selectedText);
  // Create a new span node with the selected text as its content
  let spanNode = span.create(null, state.schema.nodes.legaltext.create(null, state.schema.text(selectedText)));
  console.log("New Node: ", spanNode)
  // Create a transaction that replaces the selected text with the span node
  let tr = state.tr.replaceWith(from, to, spanNode);
  // console.log("Transaction:", tr.toJSON());  // Log the transaction
  // console.log("Doc before:", state.doc.toString());  // Log the document before
  // console.log("Doc after:", tr.doc.toString());  // Log the document after.
  
  
  // Check if the transaction is valid before dispatching
  if (dispatch) {
    dispatch(tr);
    console.log("Dispatching");
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
      let heading = state.schema.nodes.heading.create({}, state.schema.text('New Heading'));
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

function promptForNewId(oldId) {
  let newId = prompt("Enter new ID", oldId);
  return newId;
}

function updateId(state, dispatch) {
  let {from, to, node} = state.selection;
  if (node.type.name !== "span") {
    return false;  // Not a span node, ignore
  }

  let newId = promptForNewId(node.attrs.id);
  if (newId === null) {
    return false;  // User cancelled
  }

  if (dispatch) {
    let tr = state.tr.setNodeMarkup(from, null, Object.assign({}, node.attrs, {id: newId}));
    dispatch(tr);
  }
  
  return true;
}

// // Use the command
// let plugin = new Plugin({
//   key: new PluginKey('updateIdPlugin'),
//   props: {
//     handleKeyDown(view, event) {
//       if (event.key === 'Enter' && event.ctrlKey) {
//         return updateId(view.state, view.dispatch);
//       }
//       return false;
//     }
//   }
// });


function App() {
  useEffect( () => {

    const cleanSchema = new Schema({
      nodes: {
        doc: {
          content: "andocxml"
        },
        andocxml: {
          content: "andoc",
          toDOM(node) {return ["xml",0]},
          parseDOM: [{tag: "xml"}]
        },
        andoc: {
          content: "act",
          attrs: { id: {default: "akomaNtosoElement"}, class: {default: "an debug"}, xmlns: {default: "http://docs.oasis-open.org/legaldocml/ns/akn/3.0/WD17"} },
          toDOM(node) {return ['akomantoso',{ xmlns: node.attrs.xmlns, id: node.attrs.id, class: node.attrs.class }, 0]},
          parseDOM: [{tag: "akomantoso", getAttrs(dom) {return {xmlns: dom.getAttribute("xmlns"), id: dom.getAttribute("id"), class: dom.getAttribute("class")}}}]
        },
        act: {
          content: "preamble body", 
          toDOM(node) {return ['act',0]},
          parseDOM: [{tag: "act"}]
        },
        preamble: {
          content: "titleblock",
          toDOM(node) {return ['preamble',0]},
          parseDOM: [{tag: "preamble"}]
        },
        titleblock: {
          content: "shorttitle",
          toDOM(node) {return ['block',0]},
          parseDOM: [{tag: 'block'}]
        },
        body: {
          content: "section+",
          toDOM(node) { return ['body',0]},
          parseDOM: [{tag: "body"}]
        },
        shorttitle: {
          content: "text*", 
          toDOM(node) {return ['shorttitle',0]},
          parseDOM: [{tag: "shorttitle"}]
        },
        heading: {
          content: "text*",
          toDOM(node) {return ['heading',0]},
          parseDOM: [{tag: "heading"}]
        },
        section: {
          content: "heading? number intro (subsection* | paragraph* ) wrapup?",
          toDOM(node) {return ['section',0]},
          parseDOM: [{tag: "section"}]
        },
        subsection: {
          content: "heading? number intro paragraph* wrapup?",
          toDOM(node) {return ['subsection',0]},
          parseDOM: [{tag: "subsection"}]
        },
        paragraph: {
          content: "number intro subparagraph* wrapup?",
          toDOM(node) {return ['paragraph',0]},
          parseDOM: [{tag: "paragraph"}]
        },
        subparagraph: {
          content: "number intro",
          toDOM(node) {return ['subparagraph',0]},
          parseDOM: [{tag: "subparagraph"}]
        },
        intro: {
          content: "(legaltext | span)+",
          toDOM(node) { return ['intro',0]},
          parseDOM: [{tag: "intro"}]
        },
        wrapup: {
          content: "(legaltext | span)+",
          toDOM(node) {return ['wrapup',0]},
          parseDOM: [{tag: "wrapup"}]
        },
        number: {
          content: "",
          toDOM(node) { return ['num']},
          parseDOM: [{tag: "number"}]
        },
        legaltext: {
          content: "text*",
          toDOM(node) {return ['p',0]},
          parseDOM: [{tag: "p"}]
        },
        span: {
          content: "(span | legaltext)*",
          group: "block",
          attrs: { id: {default: ""}},
          toDOM(node) {return['span',{ id: node.attrs.id},0]},
          parseDOM: [{tag: "span", getAttrs(dom) {return {id: dom.getAttribute("id")}}}]
        },
        text: {},
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

    document.getElementById("set-span-id").addEventListener("click", function() {
      let { state,dispatch } = window.view;
      updateId(state,dispatch);
    });

    applyDevTools(window.view);

  })
  return (
    <div className="App">
      <button id="select-parent">Select Parent Node</button>
      <button id="toggle-debug">Toggle Debug</button>
      <button id="insert-section">Insert Section</button>
      <button id="insert-subsection">Insert Subsection</button>
      <button id="insert-header">Insert Header</button>
      <button id="insert-paragraph">Insert Paragraph</button>
      <button id="insert-subparagraph">Insert Subaragraph</button>
      <button id="insert-wrapup">Insert Wrapup</button>
      <button id="insert-span">Insert Span</button>
      <button id="set-span-id">Name Span</button>
      <div id="editor"></div>
      <p>LawMirror: Demonstration of using <a href="https://prosemirror.net">ProseMirror</a> to generate <a href="http://www.akomantoso.org/">AkomaNtoso</a> by Lexpedite Legal Technology Ltd.</p>
    </div>
  );
}


export default App;
