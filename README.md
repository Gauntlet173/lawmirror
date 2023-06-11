# LawMirror

So this is a basic react package with some stuff added from a ProseMirror example online, to allow me to play
with the possibility of doing structured legislative editing in the AkomaNtoso XML format in the browser.

Clone the repository, do npm install of the libraries referred to in App.js and run `npm start`, and it should launch the editor in a new browser window for you.

Currently, the schema mandates a title element, and one section element. The section must have a num element and an intro element.
Those aren't requirements of AkomaNtoso, those are just things I'm doing for demonstration purposes.

Note that if you add later sections, it will let you delete some, but
it won't let you delete the last one.

The formatting is not terribly friendly, yet, so I'm displaying the XML tags using CSS to help you see what's going on. You can turn them off
by toggling the debug mode, but if you do, a bunch of other things break, at the moment.

What it demonstrates is that you can have a user interface in the web browser that gives users a WYSIWYM-style
UI, but which also prevents them from doing anything that would go outside the bounds of the schema you have defined,
and which generates compliant XML live as you go.

Note that if you open the developer tools, you can see that the content of the editor div is actually a valid akomantoso document.

Which also means that any valid akomontoso could be copied and pasted into the editor, and the editor would be able to deal with it.
(Assuming that the schema designed in prosemirror covered all of the elements and attributes in use by the file you pasted in.)

Known Problems:
* Can't cursor into legaltext sections when they are created empty
* Can't see where the legaltext sections are when they are empty.
* Shouldn't add a header or wrap-up if there already is one in the current element.

Some todos:
* Make sure that I'm following the <title> syntax properly. It might be in a different place in CLEAN.
* Implement undo and redo
* Better keyboard shortcuts.
* add advanced commands
  * promote
  * demote
* Improve the UI

New Keyboard Navigation Proposal:
Ctrl-Enter - create a new paragraph in a legal text.
Enter -
  - in a title, go to the num of the first section.
  - in a header, go to the num.
  - in a num, go to the intro.
  - in an intro, go to the first sub-element, or if there are none, create one.
  - in an empty sub-element with siblings, remove it and go to the wrapup of the current parent
  - in an empty sub-element with no siblings, go to or create the next element.
  - in a full sub-element, go to or create the next sub-element.
  - in an empty wrap-up, delete it and go to or create a new element of the same type
  - in a full wrap-up, go to or create a new element of the same type.
Ctrl-Right - demote the current hierarchical element and its children if possible.
Ctrl-Left - promote the current hierarchical element and its children if possible.
Ctrl-Up - Add a header to the current section or subsection, if it doesn't already exist, and go to it.
Ctrl-Down - Add a wrapup text to the current section, subsection, or paragraph, if it doesn't already exist, and go to it.
??? - Turn the selected text into a span, and give it a name.
