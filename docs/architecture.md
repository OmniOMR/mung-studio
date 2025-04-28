# Architecture

This documentation page describes the software architecture of MuNG Studio.


## Parcel build system

When you start the development server (`npm start`) or build the application (`npm run build`), the Parcel build system is triggered. It first looks into the `package.json` file and then compiles the list of sources listed there:

```js
// package.json
{
    // ...
    "source": [
        "src/index.html"
    ]
    // ...
}
```

MuNG Studio has only one entrypoint (since it's a single-page web application) and that's the `src/index.html` file. Parcel then traces all referenced files (JS/TS via `<script>` tags, CSS/SCSS/Stylus via `<link>` tags, etc.) and compiles them to plain HTML, CSS and JS code, aggregating them in code bundles in the process.


## Bootstrapping

The `index.html` defines the `<div id="app">` root component and references the `index.jsx` file to boot up the applicaiton.

The `index.jsx` file loads React (and other global libraries, e.g. `react-scan` or could `i18n` in the future) and tells it to render the `<Application>` component as the root. The component is defined in the `Application.tsx` file.

The `Application.tsx` file is the root of the React component world. It defines the `<CssBaseline>` to set default CSS styles for the MUI Joy component library, it defines the `<StrictMode>` used in development and invokes the React Router to handle the rest.

The React Router loads the `router.tsx` file and based on the fragment URL path it displays the appropriate react page component.


## React pages

MuNG Studio is not just the editor in which you view and annotate documents. It's also its context which manages lists of documents in various places, loads them and stores them. For this reason, at the top level, MuNG Studio is a plain single-page web application with multiple virtual "pages" managed by the React Router. The editor itself is only a single React component inside this broader context.

The react pages currently have these responsibilities:

- Provide an introduction/overview/guide to the user.
- Provide access (read only, or writable) to MuNG documents from various sources. These might be:
    - Uploaded documents stored in browser's local storage (called **in-memory**)
    - Documents from a simple PHP backend server
    - Documents from a complex python backend with OMR capabilities (to be added)
    - Documents from the local filesystem when deployed as desktop app via Electron (to be added)

The first page the user lands on is the `src/ui/HomePage.tsx`, which provides quick access to all document sources, plus some introduction and metadata about MuNG Studio itself.

The purpose of a page that hosts the actual editor (the `<Editor>` component) is to download the mung document from somewhere and provide other infrastructure for the editor component to function properly.


## Editor component

The editor component in `src/ui/editor/Editor.tsx` is the whole editor screen you see when viewing/editing a MuNG document.

The API (its React props) is not yet fully designed (more like hacked together), but it roughly has these outlines that will stay unchanged:

- It receives the initial MuNG document and JPEG image background
- It receives the name of the openned document
- It emits `onSave` whenever the user wishes to persist changes (this might be due to periodic autosave as well)
    - The event argument is the modified MuNG document
    - This the value should NOT be propagated back into the editor via the "initial MuNG document" prop - once the editor component is created, it fully owns the document state (if given, it will be ignored).
- It emits `onClose` when the user wishes to "Close & Go back", whatever that means in the context of the current data source. The `onSave` event is fired by the editor before this close event is, so its handler does not need to worry about saving.

You can read more about the structure of this component in the [Editor component](editor-component.md) documentation page.
