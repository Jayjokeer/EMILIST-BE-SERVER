export enum ProjectStatusEnum {
    pending = 'pending',
    applied = 'applied',
    in_review = 'in review',
    accepted = 'accepted',
    rejected = 'rejected',
    completed = 'completed',
    unpause = "unpause",
    pause = "pause",
    cancelled = "cancelled" 
  }
  
export enum QuoteStatusEnum {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected',
}

export enum CounterOfferRoleEnum {
  job_owner = 'job_owner',
  applicant = 'applicant',
}

export enum CounterOfferStatusEnum {
  pending = 'pending',
  countered = 'countered',
  accepted = 'accepted',
  rejected = 'rejected',
}
