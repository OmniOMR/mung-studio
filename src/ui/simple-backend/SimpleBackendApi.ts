import { SimpleBackendConnection } from "./SimpleBackendConnection";

export interface Document {
  readonly name: string;
  readonly hasImage: boolean;
  readonly modifiedAt: string;
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

  public async listDocuments(): Promise<Document[]> {
    const response = await fetch(this.buildUrl("list-documents"), {
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
}
