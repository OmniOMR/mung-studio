# Performance bottlenecks

This is a list of performance bottlenecks I found in chrome with the SVG implementation of the scene view.

Note that for 100 FPS we have 10ms of time per frame. This is the budget we need to fit in.

> **Note:** For me, Chrome renders at 91 FPS with 11.1ms per frame.


## Overview panel node chips

In the overview panel, there's a list of all nodes - each has its own chip element. When moving the mouse cursor around, Chrome needs to recalculate the `:hover` CSS selector for all of them. This shows up in the profiler as `Hit test` purple box, that takes around 4.3 ms per frame.

We cannot eat up almost 50% of our frame time on stupid hit-tests. The overview panel needs to be redone to only display elemnts that are on the screen. I'm thinking about optimizations along the lines of the MUI data grid or Android list view.


## Emotion global selectors

The emotion CSS to JS library that MUI depends on registers some global CSS styles. I mean exactly this style:

```css
*, ::before, ::after {
    box-siting: inherit;
}
```

It's placed in the `<head>` tag as the last of these tags:

```html
<style data-emotion="css-global" data-s></style>
```

It's also the second-to-last element in the `<head>`.

> **Note:** You can test-fix this by simply deleting this element (from the dev tools) and to get rid of the scrollbars that appear, set `margin: 0` on the `<body>` element.

Since these three selectors apply to EVERYTHING, havin many DOM elements in general kills performance. It only triggers when CSS "computed styles" are recomputed in the [*2. Style* step of the RenderingNG](https://developer.chrome.com/docs/chromium/renderingng-architecture) engine. It is triggered only when zooming or panning the scene view, because the SVG's `transform` style is being updated. This triggers the re-computation of styles for all SVG children, which takes forever.

In the profiler it shows up as `Recalculate styles`. I debugged this via [this guide](https://developer.chrome.com/docs/devtools/performance/selector-stats).

One way to fix this is to coerce emotion to remove this selector... but that's ugly. Another way MAY be to wrap the scene view in shadow dom to shield it from the top-level CSS. Another yet may be to not render so many DOM elements (render via WebGL or canvas). Or yet another may be to rasterize these elements and render them as bitmap SVG `<image>`.

> **Note:** SVG `<image>` elements are rendered blazing fast, even when they are crazy big (if there's a few of them).


## Graph edge arrows (SVG arrows)

Rendering the SVG red arrows between MuNG nodes is SLOW. And it's slow on the GPU side! When looking at the profiler, all the browser-level code finishes fast, but frames are still dropped.

In the profiler, in the GPU section, there are green rectangles that now take around 18ms to finish (way over the frame budget). These green rectangles are (I guess) something like GPU draw-calls.

This happens even if I render JUST the edges, without any nodes (rectangles). When I render only the background image, these GPU draw calls take around 0.8 ms and when I render the background with the node rectangles, they take around 2.5 ms.


## Polygons

Polygon rendering has the same issues as SVG arrows. They consume GPU. It takes around 50ms just to render them, which feels very sluggish.

> **Note:** When polygons are occluded from view, the GPU rendering time goes down significantly. So the browser does not render what cannot be seen.
