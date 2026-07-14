export interface AngularFormArtifact {
  typescript: string;
  html: string;
  scss: string;
}

export interface ApiContractArtifact {
  endpoint: string;
  method: string;
  requestBody: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface DevelopmentArtifacts {
  projectName: string;
  angularForm: AngularFormArtifact;
  apiContract: ApiContractArtifact;
  jiraTasks: unknown[];
  testCases: unknown[];
  databaseSchema: Record<string, unknown>;
  folderStructure: string[];
  effortEstimation: string;
}
