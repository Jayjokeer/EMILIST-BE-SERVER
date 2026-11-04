export enum CustomerSuspensionType {
  temporary = "temporary",
  permanent = "permanent",
}

export enum CustomerSuspensionReason {
  fraud = "Fraud",
  policyViolation = "Policy Violation",
  unpaidEscrow = "Unpaid Escrow",
  offPlatformHarassment = "Off-Platform Harassment",
  fakeProfileOrDocumentation = "Fake Profile or Documentation",
}

export enum AdminCustomerAction {
  customerCreated = "customer.created",
  profileUpdated = "customer.profile_updated",
  passwordResetTriggered = "customer.password_reset_triggered",
  messageSent = "customer.message_sent",
  customerSuspended = "customer.suspended",
  customerReactivated = "customer.reactivated",
  walletCredited = "customer.wallet_credited",
  walletDebited = "customer.wallet_debited",
}
