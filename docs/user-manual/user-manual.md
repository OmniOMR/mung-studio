# MuNG Studio User Manual

- [Where to try it out](#where-to-try-it-out)
- [Overview](#overview)
- [Document saving](#document-saving)
- [Basic controls](#basic-controls)
- [Selecting nodes](#selecting-nodes)
- [Annotating masks](#annotating-masks)
    - [Creating new node](#creating-new-node)
    - [Modifying existing node mask](#modifying-existing-node-mask)
    - [Changing existing node class](#changing-existing-node-class)
    - [Deleting a node](#changing-existing-node-class)
- Annotating notation graph
    - ...


## Where to try it out

When you first open MuNG Studio at https://ufallab.ms.mff.cuni.cz/~mayer/mung-studio/, you can choose from a number of document sources. You have likely received an access token for the *Simple Backend*. Start by clicking on that card.

In the *Simple Backend*, enter your token and save it. The token will be stored in your web browser, so you won't need to re-insert it the next time you come. You will see a list of all the documents we have collectively annotated (or are still working on).

At the beginning of the list, there are documents whose name start with `-0- ...`. These are test documents you can open and play with. If you destroy them, no problem, that's what they are intended for.


## Overview

MuNG Studio consists of three panels:

- Overview Panel (left)
- Scene View (center)
- Inspector Panel (right)

The *Overview Panel* displays information about the whole document. It lets you control symbol visibility and rendering modes.

The *Scene View* is used to explore and annotate the document. At the bottom of the scene view there is the *Toolbelt* which lets you select various annotation tools. Clicking on objects in the *Scene View* with the default *Pointer Tool* lets you select nodes.

> **Note:** One symbol/object is called a *node*, since it's a node of the notation graph.

The *Inspector Panel* displays detailed information and controls regarding your current context. It changes based on the selected nodes and tool. When empty, it also displays tips on how to use the current tool.


## Document saving

The open document is saved automatically in the background. If you were to close MuNG Studio with unsaved changes, a dialog will open asking you to wait a little for the save to complete.

> **Warning:** Currently, there is no mechanism to resolve one document being open by multiple people. When that happens, the last person to save wins and overwrites the document. Therefore it is important that you only EDIT your own documents. But you can freely VIEW any documents.

MuNG Studio automatically creates backups of individual documents, so in case of a disaster, we can manually recover. Just let the administrators know about the issue. The backup is created each day at midnight, so during a disaster, all changes on that day will be lost.


## Basic controls

Moving the viewport:

- **Touchpad:**
    - Two-finger scroll in all 4 directions
- **Mouse:**
    - Wheel-button click & drag
    - Wheel scroll, scrolls up/down
        - With Shift scrolls sideways
        - With Ctrl zooms in/out

TODO: Global visibility options (bounding box, mask, none) (links)

Tools in the lower toolbelt:
- Cursor (V), selecting objects
- Hand (H), moving the screen disabled interactions with the scene
- Node editing (N), creating and modifying nodes
- Syntax links (L), annotating syntax links
- Precedence links (P), annotating precedence links


## Selecting nodes

Make sure you have the *Pointer Tool* (`[V]` key).

When you click on a node (left mouse button), it becomes selected. When you click on it again, it deselects.

Click on the background to deselect nodes. You can also press the `[Esc]` key.

You can select multiple nodes by holding the `[Shift]` key and clicking. Clicking on an already selected node removes it from the selection.

Alternate way to select multiple nodes is to drag-select a rectangular area. Click and hold, and move the mouse to select multiple nodes. All nodes touching the rectangle will become selected.

This method selects all nodes if there are many nodes on top of one another. It is one of the ways to select a lower node, obstructed by an upper node - select both by dragging and then deselect the top one with `[Shift]` + click.


## Annotating masks


### Creating new node

1. Select the *Node Editing Tool* (`[N]` key).
2. Click on the screen to create polygon (left mouse button).
3. Once the polygon is done, commit the polygon by pressing `[N]` or `[Enter]`.
4. Close the *Node Editing Tool* by pressing `[N]` again.

The class used for the node is shown in the *Inspector Panel* on the right. You can change the value and it will be remembered for future nodes to be created.


### Modifying existing node mask

1. Select the node.
2. Enter the *Node Editing Tool* (`[N]` key).

Now you can add polygons to the mask by repeatedly drawing a polygon and committing it. You can erase a polygon using the polygon erase tool. Drawing and erasing can be toggled by pressing `[T]`.

You can remove the last polygon point by clicking with the right mouse button.

You can cancel a partial polygon by pressing `[Esc]` key.

You can also exit the Node Editing tool by pressing `[Esc]`.


### Changing existing node class

1. Select the node
2. Enter the *Node Editing Tool* (`[N]` key).
3. In the *Inspector Panel* (right, up) change the node class (submit with enter)
4. Exit the *Node Editing Tool* via `[Esc]` or `[N]`.


### Deleting a node

Select a node and then press the `[Del]` key.
