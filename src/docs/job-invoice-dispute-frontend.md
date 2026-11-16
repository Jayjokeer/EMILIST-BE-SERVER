# Job Invoice Dispute — Frontend Integration

Base URL: `https://be.emilist.com/api/v1`

All endpoints require:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

## 1. Show the “Raise a ticket” action

Show the action on a milestone invoice when:

```ts
invoice.invoiceRaised === true &&
milestone.paymentStatus !== "paid" &&
invoice.disputeStatus !== "open"
```

If `invoice.disputeStatus === "open"`, show **Dispute under review** and use
`invoice.disputeTicketId` to open the support ticket.

## 2. Create an invoice dispute

```http
POST /support/job-invoice-disputes
```

```json
{
  "jobId": "6ab513136fc013d4563af8fe",
  "milestoneId": "6ab584cbcff7d52841928b9a",
  "invoiceId": "6ab584cbcff7d52841928b9b",
  "subject": "Work does not meet the agreed requirements",
  "reason": "The repaired pipe is still leaking and the completed work does not match the milestone requirements.",
  "attachments": [
    "https://cdn.example.com/evidence/leaking-pipe.jpg"
  ]
}
```

`invoiceId` and `subject` are optional. `reason` must contain 10–5000
characters. `attachments` accepts up to 10 already-uploaded HTTPS URLs.

Successful response: `201 Created`.

```json
{
  "message": "success",
  "data": {
    "_id": "SUPPORT_REQUEST_ID",
    "ticketCode": "TKT-ABC123",
    "status": "open",
    "category": "dispute",
    "priority": "high",
    "linkedType": "job",
    "linkedRecordId": "6ab513136fc013d4563af8fe",
    "jobId": "6ab513136fc013d4563af8fe",
    "milestoneId": "6ab584cbcff7d52841928b9a",
    "invoiceId": "6ab584cbcff7d52841928b9b"
  }
}
```

After success:

1. Store `data._id` as the support ticket id.
2. Refresh the job details.
3. Replace the payment reminder/action with **Dispute under review**.
4. Navigate to `/support/tickets/{data._id}` if the user chooses **View ticket**.

The backend stops invoice payment reminders while this dispute is open.

## 3. List the user’s support tickets

```http
GET /support/requests?page=1&limit=10&category=dispute
```

Optional filters:

- `status`: `open`, `in_progress`, `pending_customer`, `pending_resolution`, `resolved`
- `category`: use `dispute` for job invoice disputes
- `page` and `limit`

## 4. Fetch one ticket and its conversation

```http
GET /support/requests/{requestId}
```

Only the user who created the ticket can fetch it.

## 5. Reply to support

```http
POST /support/requests/{requestId}/replies
```

```json
{
  "message": "I have attached a clearer photo showing the unfinished work.",
  "attachments": [
    "https://cdn.example.com/evidence/unfinished-work.jpg"
  ]
}
```

## 6. Resolution behavior

When an administrator resolves the ticket:

- The ticket status becomes `resolved`.
- The user receives a `support_resolved` notification containing the support
  request, job, milestone, and invoice identifiers.
- The linked invoice’s `disputeStatus` becomes `resolved`.
- The frontend should refresh both the ticket and job details.
- If the invoice is still unpaid, the normal invoice/payment flow becomes
  available again and payment reminders may resume.

## Error handling

- `400`: invalid payload, invoice not raised, mismatched invoice, or an open
  dispute already exists.
- `401`: missing or expired access token.
- `403`: the authenticated user is not the job owner.
- `404`: job, milestone, invoice, or support ticket not found.

Do not create a generic support request for this flow. Always use
`POST /support/job-invoice-disputes` so ownership is verified and the invoice is
placed into the disputed state.
