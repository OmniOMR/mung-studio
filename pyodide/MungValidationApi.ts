import { ValidationIssue } from "../src/editor/model/ValidationIssue";
import { PyodideWorkerConnection } from "./PyodideWorkerConnection";

/**
 * Exposes python operations for validating MuNG documents
 */
export class MungValidationApi {
  private connection: PyodideWorkerConnection;

  constructor(connection: PyodideWorkerConnection) {
    this.connection = connection;
  }

  /**
   * Invokes the validation process that produces a list of validation
   * issues that the user can eiter just read, or silence, or have
   * automatically resolved.
   */
  public async runValidation(mungXml: string): Promise<ValidationIssue[]> {
    const result = await this.connection.executePython(
      `
        import json
        import numpy as np
        from mstudio.validation.run_validation import run_validation
        from dataclasses import asdict
        
        mung_xml = str(mungXml)

        issues = run_validation(mung_xml)

        issues_json_string = json.dumps([i.to_json() for i in issues])

        issues_json_string  # return statement
      `,
      {
        mungXml: String(mungXml),
      },
    );

    const issues: ValidationIssue[] = JSON.parse(result);

    return issues;
  }
}
