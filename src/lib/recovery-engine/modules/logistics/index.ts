import type { RecoveryRule } from "../../core/types";
import { logisticsFreeTimeRule } from "./free-time-variance";
import { logisticsFuelSurchargeRule } from "./fuel-surcharge-variance";
import { logisticsRateVarianceRule } from "./rate-variance";
import { logisticsUnapprovedAccessorialRule } from "./unapproved-accessorial";

/** Parcel, LTL/FTL trucking, drayage, and ocean (transatlantic / transpacific) share one rule pack. */
export const logisticsRules: RecoveryRule[] = [
  logisticsRateVarianceRule,
  logisticsFuelSurchargeRule,
  logisticsFreeTimeRule,
  logisticsUnapprovedAccessorialRule,
];

export { logisticsFreeTimeRule, logisticsFuelSurchargeRule, logisticsRateVarianceRule, logisticsUnapprovedAccessorialRule };
