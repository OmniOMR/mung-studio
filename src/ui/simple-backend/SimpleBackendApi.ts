import { SimpleBackendConnection } from "./SimpleBackendConnection";

export interface Document {
  readonly name: string;
  readonly hasImage: boolean;
  readonly modifiedAt: string;
}

export interface WhoamiResponse {
  /**
   * Name of the authenticated user
   */
  readonly name: string;
}

export class SimpleBackendApi {
  private readonly connection: SimpleBackendConnection;

  constructor(connection: SimpleBackendConnection) {
    this.connection = connection;
  }

  private buildUrl(action: string, document: string | null = null): string {
    const urlWithAction =
      this.connection.backendUrl + "?action=" + encodeURIComponent(action);

    if (document === null) {
      return urlWithAction;
    }

    return urlWithAction + "&document=" + encodeURIComponent(document);
  }

  public async whoami(): Promise<WhoamiResponse> {
    const response = await fetch(this.buildUrl("whoami"), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.connection.userToken,
      },
    });
    if (response.status === 401) {
      throw new Error("Invalid user token.");
    }
    if (!response.ok) {
      throw new Error("Unexpected response: " + (await response.text()));
    }
    const data = await response.json();
    return data as WhoamiResponse;
  }

  public async listDocuments(): Promise<Document[]> {
    const response = await fetch(this.buildUrl("list-documents"), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.connection.userToken,
      },
    });
    if (response.status === 401) {
      throw new Error("Invalid user token.");
    }
    if (!response.ok) {
      throw new Error("Unexpected response: " + (await response.text()));
    }
    const data = await response.json();
    return data.documents as Document[];
  }

  public async getDocumentMung(documentName: string): Promise<string> {
    const response = await fetch(
      this.buildUrl("get-document-mung", documentName),
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + this.connection.userToken,
        },
      },
    );
    if (response.status === 401) {
      throw new Error("Invalid user token.");
    }
    if (!response.ok) {
      throw new Error("Unexpected response: " + (await response.text()));
    }
    return await response.text();
  }

  public async getDocumentImage(documentName: string): Promise<Blob> {
    const response = await fetch(
      this.buildUrl("get-document-image", documentName),
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + this.connection.userToken,
        },
      },
    );
    if (response.status === 401) {
      throw new Error("Invalid user token.");
    }
    if (!response.ok) {
      throw new Error("Unexpected response: " + (await response.text()));
    }
    return await response.blob();
  }

  public async uploadDocumentMung(
    documentName: string,
    mungXmlString: string,
  ): Promise<void> {
    const response = await fetch(
      this.buildUrl("upload-document-mung", documentName),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/mung+xml",
          Authorization: "Bearer " + this.connection.userToken,
        },
        body: mungXmlString,
      },
    );
    if (response.status === 401) {
      throw new Error("Invalid user token.");
    }
    if (!response.ok) {
      throw new Error("Unexpected response: " + (await response.text()));
    }
  }
}
