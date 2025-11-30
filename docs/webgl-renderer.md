# WebGL renderer

This document describes the architecture, interface and various oddities and specifics of the WebGL 2 rendering backend.

## General architecture

At the moment, the WebGL renderer consists of two layers - the mask texture, which displays MuNG node bitmaps, and
the syntax/precedence links, which are rendered as polygons.

To that end, there is a minimal abstraction over the standard WebGL interface provided, called `GLRenderer`. This class
allows registering multiple `GLDrawables`, which are invoked when a re-render is requested, and provides utility functions
for state management and creation of shaders/textures etc.

Furthermore, the `GLRenderer` manages a simple orthographic model/view/projection matrix generated from the viewport transform. It is automatically bound to the shader uniform `u_mvp_matrix`. Shaders can, of course, use additional uniforms,
which can be bound with the `setUniform...` methods inside a `GLDrawable` callback.

### Primitive buffers

As the setup of geometry buffers may be more complicated than what our WebGL abstraction can handle, they are implemented
using a `GLBuffer` interface, which is passed a reference to the raw WebGL rendering context in the `bind` method. Here
the buffer should perform allocation, updates, shader attribute configuration etc.

## The Geometry engine

To minimize draw calls when rendering syntax/precedence links, there is a special utility class that allows for the creation
of merged/combined geometry from several independent "pieces". There are a couple of assertions that must hold in order for it to be useable:

- All pieces must have a constant number of vertices that does not change throughout rendering. This is so that they can be updated without affecting the rest of the buffer.
- All geometry has the same attributes and dimensions.
- Everything can be rendered using one shader/material.

Once these requirements are met, we can boil down rendering of a large amount of geometry to a single draw call, which greatly improves performance.

Implementations should simply extend the `GeometrySource` interface and provide the constant amount of vertices and implement
the `generateVertices` function that generates that amount vertices and provides them to the engine. `GeometrySource`s can then be used with `addGeometry`, `removeGeometry` and `updateGeometry` methods.

If there is a need to use multiple vertex attributes (e. g. position, normal, color), you should create separate `GeometryBuffer`s and use them in tandem. For reference, see the `LinkGeometryDrawable` implementation.

## Shaders

All shaders use GLSL version `300 es` and must output premultiplied alpha. This is so that transparency works as intended
when being overlaid on top of the browser-rendered background image. In most cases, this can be done by multiplying the RGB channels by the A channel as the last step of the shader with little to no performance deficit.

## Syntax/precedence link rendering

I will spare the readers of an explanation of how exactly the syntax/precedence link geometry is generated, as the algorithm involves a lot of trial and error, and focus mainly on rendering in this section. What is important to consider is that the rather exotic algorithm outputs 4-component vectors, wherein the `x,y` components are the actual `x,y` coordinates of the "arrows" that represent the links, and the `z,w` coordinates are the `x,y` coordinates of "normal vectors" that can be scaled at will and then summed with the `x,y` coordinates to produce larger arrows without the need for separate draw calls/transform matrices and with no geometry overlaps. For avoidance of confusion, I will remark that these are **not** actually normal vectors (in most cases) and they are sometimes of non-unit lengths. They are quite similar to vertex normals, but they have a different purpose.

The link renderer implements the `GeometrySource` interface as mentioned above and synchronizes the editor repository with the renderer using event callbacks. It uses two buffers - one for the 4-component geometry and another for integer-based per-vertex "attributes". These control the visibility of individual arrows within the large geometry buffer as well as whether they are highlighted or not.

Rendering is done in 3 separate passes:

1) The `NORMAL` pass, where all non-selected arrows are drawn.
2) The `OUTLINE` pass, where the white outlines of selected arrows are drawn. These take the same shape as their arrows, but are scaled up a little using the "normal" vectors. They will always be on top of the non-selected arrows.
3) Finally, the `SELECTION` pass, which draws selected arrows in the same manner as the `NORMAL` pass, but on top of the white outlines. This results in nice, smooth overlaps of selected arrows, where the intersecting links do not overlap in an ugly way, but seamlessly merge together.

All of these passes use the same single geometry buffer. Depth testing is not used, so the higher layers are overlaid on top of lower ones automatically. Geometry that should be hidden is "degenerated", i. e. collapsed to a single point at coordinates (0, 0), and then discarded in the fragment shader.

To improve GPU performance, the vertex shaders are fully branchless. Even though there are `if` and `else` statements, their results only depend on uniforms which stay constant throughout the entire draw call, so most drivers/GPUs are able to optimize these out. This is why you may see some odd code particularly when checking for the visibility/highlight attribute flags, as they use math operations on the actual integer value of the attribute field rather than branches. The result, however, is the same.

The scale of arrows and the displacement of highlight outlines is calculated in an anisotropic way based on the viewport scale for +- optimal visibility by the user. It is then passed to the `u_calcZoomDisp` shader uniform. Note that this is a multiplier of the "normal vector", not the size of the actual arrow. It's not really possible to use a "scalar" scale on the whole arrow, as it is resized non-uniformly.

## Node mask rendering

As far as the GPU is concerned, rendering of node masks is trivial. In the general case, they are rendered as a single rectangle with a texture mapped onto it. However, there is a fallback for GPUs that do not support large texture sizes, where the rectangle is subdivided into smaller chunks. This is, however, done transparently when being uploaded to the GPU, using `GL_UNPACK_ROW_LENGTH`, so that the texture on the host/CPU side can be interacted with as a single buffer.

As foreshadowed above, the actual calculation of the node mask pixel data is done on the CPU. This has the unfortunate effect of longer startup times, but given that further updates do not necessitate the recalculation of the whole texture (only smaller regions), it is a one-time cost.

Individual texture pixels are constructed from a list of influencing nodes using the OVER alpha compositing operator - see https://en.wikipedia.org/wiki/Alpha_compositing. The influencing nodes are obtained from a R-Tree-based spatial index once for each update - it is assumed that individual updates do not span more than a couple of nodes and are not overly large in dimension.

Nodes can be made visible or invisible, but this always necessitates a full recalculation of the affected texture region, as alpha blending has to be redone.

### Dynamic re-dimensioning of the node mask texture

Since MuNG does not have a fixed canvas size, the size of the mask texture is approximately estimated when it is first initialized. However, as new nodes are drawn, it will dynamically increase. The parameters for this operation can be controlled using the `TextureSafezones` interface, which will add some padding beyond the maximum used coordinate as well as copy whitespace in the left/top regions with a certain multiplier.