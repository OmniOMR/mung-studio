import { Node } from "../../mung/Node";
import { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface SurfaceProps {
  readonly nodes: Node[];
}

export function Surface(props: SurfaceProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // D3 tutorial:
    // https://www.d3indepth.com/gettingstarted/

    if (svgRef.current === null)
      return;

    // clear the content
    svgRef.current.innerHTML = "";

    const svgElement = d3.select(svgRef.current);

    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", zoomed);

    const g = svgElement.append("g");

    const uuid = "fbc49126-72c9-4b12-a6ff-8455d2ce9b4d";
    g.append("image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("href", `https://api.kramerius.mzk.cz/search/iiif/uuid:${uuid}/full/max/0/default.jpg`)
      .style("image-rendering", "pixelated");

    g.selectAll("rect")
      .data(props.nodes)
      .enter()
      .append("rect")
      .attr("id", (node: Node) => "mung_id_" + node.id)
      .attr("x", (node: Node) => node.left)
      .attr("y", (node: Node) => node.top)
      .attr("width", (node: Node) => node.width)
      .attr("height", (node: Node) => node.height)
      .attr("fill", "rgba(255, 0, 0, 0.1)")
      .attr("stroke", "rgba(255, 0, 0, 1)")
      .attr("stroke-width", "3");
    
    svgElement.call(zoom);

    function zoomed(event) {
      const {transform} = event;
      g.attr("transform", transform);
      // g.attr("stroke-width", 1 / transform.k);
    }

    // ...
  }, []);
  
  return (
    <svg
      ref={svgRef}
      style={{
        width: "100%",
        height: "500px",
        border: "1px solid gray",
      }}
    />
  );
}