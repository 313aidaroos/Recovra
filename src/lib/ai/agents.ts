export type AgentRole =
  | "document"
  | "contract"
  | "matching"
  | "audit"
  | "evidence"
  | "recovery"
  | "prevention"
  | "optimization"
  | "executive";

export type AgentTask<Input, Output> = {
  organizationId: string;
  role: AgentRole;
  input: Input;
  sourceReferences: string[];
  idempotencyKey: string;
  run(input: Input): Promise<Output>;
};

export type AdvisoryAgentOutput<T> = {
  advisory: true;
  confidence: string;
  data: T;
  sourceReferences: string[];
  requiresHumanReview: boolean;
};

export const agentBoundaries = {
  may: ["extract", "classify", "match", "explain", "draft", "summarize"],
  mayNot: ["submit_claim", "send_money", "change_vendor_account", "modify_contract", "declare_recovery_realized"],
} as const;

/**
 * Agents produce advisory structured output. Deterministic rules own financial
 * calculations, and workflow services enforce approval before external action.
 */
export interface RecovraAgent<Input, Output> {
  role: AgentRole;
  execute(task: Omit<AgentTask<Input, Output>, "run">): Promise<AdvisoryAgentOutput<Output>>;
}
