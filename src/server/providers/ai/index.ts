/// AI is deliberately not wired to a model provider in the MVP. This interface
/// fixes the contract so a provider can be added later without touching call
/// sites, and enforces the product rule that AI output is advisory only:
/// suggestions are returned for human review and never applied to documents.
export type AiSuggestion = {
  kind: "classification" | "summary" | "grammar" | "terminology" | "compliance";
  label: string;
  detail: string;
  confidence: number;
};

export type AiAnalysisInput = {
  projectId: string;
  filename: string;
  mimeType: string;
  content: Buffer;
};

export interface AiProvider {
  readonly name: string;
  readonly enabled: boolean;
  analyseDocument(input: AiAnalysisInput): Promise<AiSuggestion[]>;
}

class DisabledAiProvider implements AiProvider {
  readonly name = "disabled";
  readonly enabled = false;
  async analyseDocument(): Promise<AiSuggestion[]> {
    return [];
  }
}

let provider: AiProvider = new DisabledAiProvider();

export function ai(): AiProvider {
  return provider;
}

export function registerAiProvider(next: AiProvider): void {
  provider = next;
}
