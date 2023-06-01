# ProseMirror Legislative Editing Test

So this is a basic react package with some stuff added from a ProseMirror example online, to allow me to play
with the possibility of doing structured legislative editing in the browser.

Clone the repository and new `npm start`, and it should launch the editor in a new browser window for you.

Currently, the schema mandates a title element, and one section element. The section must have a num element and an intro element.
Those aren't requirements of AkomaNtoso, those are just things I'm doing for demonstration purposes.

You can add sections to the code by pressing `SHIFT-CTRL-1`. Note that if you add later sections, it will let you delete some, but
it won't let you delete the last one.

The formatting is not terribly friendly, yet, so I'm displaying the XML tags using CSS to help you see what's going on.

What it demonstrates is that you can have a user interface in the web browser that gives users a WYSIWYM-style
UI, but which also prevents them from doing anything that would go outside the bounds of the schema you have defined,
and which generates compliant XML live as you go.

Note that if you open the developer tools, you can see that the content of the editor div is actually a valid akomantoso document.

Which also means that any valid akomontoso could be copied and pasted into the editor, and the editor would be able to deal with it.
(Assuming that the schema designed in prosemirror covered all of the elements and attributes in use by the file you pasted in.)

Some todos:
* add the required akomantoso elements to the ProseMirror schema
* define commands that allow the user to make the basic editing operations (add sibling, remove, promote, demote, add child, convert, etc.)
* Create UI elements and keyboard shortcuts that make it easy to navigate around, and see what you are doing.
* Add a "debug" flag that will turn on & off the XML tag info
* Improve the CSS so that the numbers appear on the first line of the first intro paragraph, etc.