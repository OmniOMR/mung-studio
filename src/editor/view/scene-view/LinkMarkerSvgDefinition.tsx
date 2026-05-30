import {
  LINK_OUTLINE_STROKE_WIDTH,
  LINK_STROKE_WIDTH,
} from "../../../mung/linkAppearance";

/**
 * An invisible SVG element with definitions for the SVG-rendered link markers
 */
export function LinkMarkerSvgDefinition() {
  const outlineThickeningRatio = LINK_OUTLINE_STROKE_WIDTH / LINK_STROKE_WIDTH;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      }}
    >
      <defs>
        {/* Used by links to render the arrow head */}
        <marker
          id="mung-link-arrow-head"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <line
            x1="4"
            y1="1"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth="1"
            strokeLinecap="square"
          />
          <line
            x1="4"
            y1="9"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth="1"
            strokeLinecap="square"
          />
        </marker>
        <marker
          id="mung-link-arrow-head--selection-outline"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth={10 / outlineThickeningRatio}
          markerHeight={10 / outlineThickeningRatio}
          orient="auto-start-reverse"
        >
          <line
            x1="4"
            y1="1"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth={outlineThickeningRatio}
            strokeLinecap="square"
          />
          <line
            x1="4"
            y1="9"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth={outlineThickeningRatio}
            strokeLinecap="square"
          />
        </marker>
      </defs>
    </svg>
  );
}
