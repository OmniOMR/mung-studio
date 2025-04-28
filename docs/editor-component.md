# Editor component

This documentation page described the architecture of the `<Editor>` react component in `src/ui/editor/Editor.tsx`. The editor is the whole screen you see when viewing/editing a MuNG document.

The codebase for the editor is present in the folder `src/ui/editor`.


## Jotai state management

The editor component is not a simple React form, where you use `useState` in various places and if you have a shared state you elevate that state to the parent and pass it down via props. If you did that, you'd realize ALL THE IMPORTANT STATE is in the root and it's passed to almost all children.

This is problematic for two reasons:

1. Changing anything would trigger re-render of the whole editor, cascading down to children.
2. Having many children (2 000 MuNG nodes) kills re-render performance even if only one child needs to change.

These two problems combine such that we have to resort to a state management library. We chose [Jotai](http://jotai.org/) since we were familiar with it. It builds the state up from individual atoms and react components can then observe these atoms.

Basically instead of having `useState`, you have `useAtom(myAtom)`, where the atom instance is a state store component that lives outside of the React component.

In addition, the editor has some real-time features (mouse move handlers, etc.), which cannot be passed through React state management, as doing a re-render 100x a second is unnecessarily costly. Jotai lets us have plain vanilla javascript variables that store our state, that can be accessed from plain javascript (e.g. in mouse move handlers) and that can be exposed to React via Jotai computed atoms.

This lets us combine the model-view reactivity of React, with the performance of vanilla javascript.

This results in this top-level architecture for the editor component:


## Top-level architecture

At the top level, using Model-View-Controller terminology, the code is split between:

- the state (Model) ... JS variables and Jotai atoms
- and the UI (View + Controller) ... React components and hooks

The state is encapsulated in set of javascript classes, called *stores* (e.g. `NotationGraphStore`), which are created inside the `<Editor>` component and persisted via `useMemo`. They are passed down to children via props (or React context), but their value never changes (they are the same class instance for the whole lifetime of the `<Editor>` component):

```tsx
export function Editor() {
    const notationGraphStore = useMemo(() => new NotationGraphStore(), []);

    return <ChildComponent notationGraphStore={notationGraphStore} />;
}
```

These stores can be consumed via plain javascript (e.g. in event handlers):

```tsx
export function ChildComponent({notationGraphStore}) {
    // ...

    function onClickOrSomething() {
        // read the state
        console.log("Nodes in the graph are:", notationGraphStore.nodes);

        // or call a method that modifies the state
        notationGraphStore.insertLink(fromId, toId, type);
    }

    // ...
}
```

Or with React reactivity via corresponding Jotai atoms:

```tsx
import { useAtomValue } from "jotai";

export function ChildComponent({notationGraphStore}) {
    const nodes = useAtomValue(notationGraphStore.nodesAtom);

    // ...

    return <pre>{ JSON.stringify(nodes, null, 2) }</pre>;
}
```

The store must be implemented in such a way that changing the state with either its methods or via writable Jotai atoms triggers the update of all other affected Jotai atoms, which in-turn triggers a re-render of subscribed React components.

State stores also sometimes expose plain javascript events (from the `strongly-typed-events` library), in case you need to observe changes from outside of React components. For example:

```ts
notationGraphStore.onNodeInserted.subscribe((node) => {
    // ...
});
```


## State stores

The editor component defines these top-level state stores:

- `NotationGraphStore` Stores the music notation graph (nodes and links) and the document metadata (dataset, document name). Exposes read-only view at the list of used node class names. Provides ordering of nodes in the scene-order (how they are rendered). This store is initialized from a MuNG file and is serialized into a MuNG file when saving.
- `SelectionStore` Stores the set of selected nodes and links. Allows manipulation with the selection. Observes the `NotationGraphStore` so that it automatically handles node and link removals (removing them from the selection).
- `ClassVisibilityStore` Stores the set of visible and hidden node class names (underlies the class visibility settings available in the left overview panel of the editor).
- `EditorStateStore` Stores various temporary preferences and state of the editor component, such as the currently equipped tool, display options for nodes and links, selection laziness, etc.
- `HistoryStore` (To be added!) Will observe changes in other stores and make snapshots for undo/redo functionality. (I already implemented a similar store in the DocMarker tool [here](https://github.com/Jirka-Mayer/doc-marker/blob/main/src/state/historyStore.js))
- `AutosaveStore` Observes changes to the `NotationGraphStore` and emits the `onAutosave` event, as well as exposing an `isDirty` Jotai atom. The editor component handles this event and performs saving.


## React components

The editor component has three main components, from left to right:

- `<OverviewPanel>` The left panel with main menu, document metadata, and nodes list.
- `<SceneView>` The central area where you see the scanned document image with MuNG nodes overlayed on top. You zoom and pan this component and interact with the notation graph.
- `<InspectorPanel>` The right panel that shows details for the current context (the tool or selection).
