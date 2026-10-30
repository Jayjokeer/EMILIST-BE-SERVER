import test from 'node:test';
import assert from 'node:assert/strict';
import { JobStatusEnum, MilestoneEnum, MilestonePaymentStatus } from '../src/enums/jobs.enum';
import { ProjectStatusEnum } from '../src/enums/project.enum';
import { areAllMilestonesCompletedAndPaid, buildVisibleJobsQuery, raiseMilestoneInvoice, rejectCompletedMilestone, resolveJobDisplayStatus, serializeMilestoneWithInvoiceDate } from '../src/services/job.service';

test('invoice issue date is recorded once and preserved', () => {
  const firstIssueDate = new Date('2026-10-29T10:00:00.000Z');
  const firstInvoiceId = 'invoice-1';
  const invoice: any = { invoiceRaised: false };

  raiseMilestoneInvoice(invoice, firstIssueDate, firstInvoiceId);
  raiseMilestoneInvoice(invoice, new Date('2026-10-30T10:00:00.000Z'), 'invoice-2');

  assert.equal(invoice.invoiceRaised, true);
  assert.equal(invoice.invoiceId, firstInvoiceId);
  assert.equal(invoice.issuedAt, firstIssueDate);
});

test('legacy invoices expose a null issue date in job details', () => {
  assert.deepEqual(serializeMilestoneWithInvoiceDate({
    status: MilestoneEnum.completed,
    invoice: { invoiceRaised: true },
  }).invoice, {
    invoiceRaised: true,
    invoiceId: null,
    issuedAt: null,
  });
});

test('owner rejection reactivates completed work and records the reason', () => {
  const rejectedAt = new Date('2026-10-30T09:00:00.000Z');
  const milestone: any = {
    status: MilestoneEnum.completed,
    paymentStatus: MilestonePaymentStatus.unpaid,
    invoice: { invoiceRaised: true, reviewStatus: 'pending' },
  };

  rejectCompletedMilestone(milestone, 'Please correct the leaking joint.', rejectedAt);

  assert.equal(milestone.status, MilestoneEnum.active);
  assert.equal(milestone.invoice.reviewStatus, 'rejected');
  assert.equal(milestone.invoice.rejectionReason, 'Please correct the leaking joint.');
  assert.equal(milestone.invoice.rejectedAt, rejectedAt);
});

test('completed milestone work does not complete the job before payment', () => {
  assert.equal(areAllMilestonesCompletedAndPaid([{
    status: MilestoneEnum.completed,
    paymentStatus: MilestonePaymentStatus.unpaid,
  }]), false);
});

test('the job can complete after every completed milestone is paid', () => {
  assert.equal(areAllMilestonesCompletedAndPaid([
    { status: MilestoneEnum.completed, paymentStatus: MilestonePaymentStatus.paid },
    { status: MilestoneEnum.completed, paymentStatus: MilestonePaymentStatus.paid },
  ]), true);
});

test('status endpoint includes jobs owned by or assigned to the artisan', () => {
  assert.deepEqual(buildVisibleJobsQuery('artisan-1', ['application-1']), {
    $or: [
      { userId: 'artisan-1' },
      { acceptedApplicationId: { $in: ['application-1'] } },
    ],
  });
});

test('an accepted job is active from the artisan perspective', () => {
  const artisanId = 'artisan-1';
  const job = {
    userId: 'owner-1',
    status: JobStatusEnum.active,
    applications: [{ user: artisanId, status: ProjectStatusEnum.accepted }],
  };

  assert.equal(resolveJobDisplayStatus(job, artisanId), JobStatusEnum.active);
});

test('an accepted application follows the job lifecycle after activation', () => {
  const artisanId = 'artisan-1';
  const application = {
    _id: 'application-1',
    user: artisanId,
    status: ProjectStatusEnum.accepted,
  };

  assert.equal(resolveJobDisplayStatus({
    userId: 'owner-1',
    acceptedApplicationId: application._id,
    status: JobStatusEnum.paused,
    applications: [application],
  }, artisanId), JobStatusEnum.paused);

  assert.equal(resolveJobDisplayStatus({
    userId: 'owner-1',
    acceptedApplicationId: application._id,
    status: JobStatusEnum.complete,
    applications: [application],
  }, artisanId), JobStatusEnum.complete);
});

test('application-only states remain visible to the artisan', () => {
  const artisanId = 'artisan-1';
  const job = {
    userId: 'owner-1',
    status: JobStatusEnum.listed,
    applications: [{ user: artisanId, status: ProjectStatusEnum.rejected }],
  };

  assert.equal(resolveJobDisplayStatus(job, artisanId), ProjectStatusEnum.rejected);
});
