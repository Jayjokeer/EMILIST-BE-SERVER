export enum SupportRequestStatus {
  open = "open",
  inProgress = "in_progress",
  pendingCustomer = "pending_customer",
  pendingResolution = "pending_resolution",
  resolved = "resolved",
}

export enum SupportRequestPriority {
  low = "low",
  normal = "normal",
  medium = "medium",
  high = "high",
  critical = "critical",
  urgent = "urgent",
}

export enum SupportRequestCategory {
  account = "account",
  job = "job",
  payment = "payment",
  financial = "financial",
  dispute = "dispute",
  technical = "technical",
  moderation = "moderation",
  operations = "operations",
  marketplace = "marketplace",
  report = "report",
  other = "other",
}
