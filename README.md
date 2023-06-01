# LawMirror

So this is a basic react package with some stuff added from a ProseMirror example online, to allow me to play
with the possibility of doing structured legislative editing in the AkomaNtoso XML format in the browser.

Clone the repository, do npm install of the libraries referred to in App.js and run `npm start`, and it should launch the editor in a new browser window for you.

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
* Come up with an interface for editing the attributes of the elements, particularly so that we can give names to spans.

Proposed Keyboard Navigation Rules:
* Title
  * If you are anywhere in the title and you hit enter, it will move the cursor to the first section.
* Section
  * If you are at the end of a paragraph that is the last paragraph in a section, and you hit enter, it will create a new section
  * If you are in a section and hit tab, the section will be converted into a subsection of the previous section, and its children demoted also, if possible.
  * If you are in an empty section and you hit enter, nothing will happen.
  * If you are in a section and you hit CTRL-H, it will insert a header for that section and move the cursor there.
* Subsection
  * If you are at the end of a paragraph that is the last paragraph in a subsection, and you hit enter, it will create a new subsection
  * If you are at the start of a subsection and hit tab, the subsection will be converted into a paragraph under the previous subsection or section and its children demoted also if possible
  * If you are at the start of a subsection and hit shift-tab, the subsection will be promoted into a section and its children promoted too, if possible.
  * If you are at the start of an empty subsection that is the last subsection in a list, and you hit enter, the empty subsection will be converted into a wrapup text.
  * If you are in a subsection and you hit CTRL-H, it will insert a header for that subsection and move the cursor there.
* Wrapup
  * If you hit enter in an empty wrapup text, it is removed and replaced with a new element of the same level as the one that it is wrapping up.
  * If you hit enter in a filled wrapup text, it creates a new element of the same level as the one you were wrapping up.
* Number
  * If you hit enter in a number field it takes you to the first paragraph in the intro.
* Header
  * If you hit enter in an empty header, it will be removed.
* Paragraph
  * If you are at the end of a text that is the last text in a paragraph, and you hit enter, it will create a new paragraph
  * If you are at the start of a paragraph and hit tab, the paragraph will be demoted into a sub- paragraph under the previous paragraph if possible.
  * If you are at the start of a paragraph and hit shift-tab, the paragraph will be promoted into a subsection with its children, if possible.
  * If you are at the start of an empty paragraph that is the last paragraph in a section or subsection, and you hit enter, the empty paragraph will be converted into a wrapup text.
* Subparagraph
  * If you are at the end of a text that is the last text in a sub-paragraph, and you hit enter, it will create a new sub-paragraph
  * If you are at the start of a sub-paragraph and hit shift-tab, the sub-paragraph will be promoted into a paragraph, if possible (I think this is always possible).
  * If you are at the start of an empty sub-paragraph that is the last sub-paragraph in a paragraph, and you hit enter, the empty sub-paragraph will be converted into a wrapup text.
* LegalText
  * If you hit CTRL-ENTER inside a legal text, a new legal text will be added after the current one, or the current one split into two, as appropriate.
  * If you hit CTRL-S while selecting a portion of a legal text, that portion of the legal text will be converted into a span.