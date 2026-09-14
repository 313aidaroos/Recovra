import type { RecoveryRule } from "../../core/types";
import { duplicateInvoiceRule } from "./duplicate-invoice";
import { duplicateLineRule } from "./duplicate-line";

export const accountsPayableRules: RecoveryRule[] = [duplicateInvoiceRule, duplicateLineRule];

export { duplicateInvoiceRule, duplicateLineRule };
