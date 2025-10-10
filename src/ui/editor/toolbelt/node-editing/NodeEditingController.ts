import { PolygonToolsController } from "./PolygonToolsController";

/**
 * Encapsulates logic for the node editing tool
 */
export class NodeEditingController {
  // controllers for individual sub-tools
  public readonly polygonToolsController: PolygonToolsController;

  constructor() {
    this.polygonToolsController = new PolygonToolsController();
  }
}