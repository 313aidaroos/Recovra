import { accountsPayableRules } from "./modules/accounts-payable";
import { logisticsRules } from "./modules/logistics";
import type { RecoveryRule } from "./core/types";

export * from "./core/money";
export * from "./core/matching";
export * from "./core/run";
export * from "./core/severity";
export * from "./core/types";
export * from "./modules/logistics";
export * from "./modules/accounts-payable";

/** Every rule shipped with the platform. Organizations activate modules; the engine filters by module. */
export const allRecoveryRules: RecoveryRule[] = [...logisticsRules, ...accountsPayableRules];

export const RULESET_VERSION = allRecoveryRules.map((rule) => `${rule.id}@${rule.version}`).sort().join(",");
