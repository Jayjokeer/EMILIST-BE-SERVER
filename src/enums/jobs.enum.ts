export enum JobType {
    biddable = "biddable",
    regular= "regular",
    direct= "direct",
  }

export enum JobExpertLevel {
    one = "one",
    two= "two",
    three= "three",
    four= "four",
  };

  export enum JobPeriod {
    days = "days",
    weeks= "weeks",
    months= "months",
    years= "years"
  }

  export enum MilestoneEnum {
    pending= "pending",
    overdue= "overdue",
    completed= "completed",
    active= "active",
    paused= "paused",
  }

  export enum MilestonePaymentStatus {
    paid= "paid",
    unpaid= "unpaid"
}

export enum JobStatusEnum {
  pending= "pending",
  complete= "completed",
  active= "active",
  paused= "paused",
}

export enum QuoteStatusEnum {
  pending= "pending",
  accepted= "accepted",
  rejected= "rejected"
}