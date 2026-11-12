# User Wallet Endpoints

## Base URL

```text
https://be.emilist.com/api/v1
```

All endpoints in this document require an authenticated user unless stated otherwise.

```http
Authorization: Bearer <access_token>
```

Successful JSON responses generally use this structure:

```json
{
  "message": "success",
  "data": {}
}
```

Supported wallet currencies are `NGN`, `USD`, `GBP`, and `EUR`.

## Wallet Management

### 1. Create a wallet

Creates a wallet for a currency. A user can have only one wallet for each currency.

```http
POST /wallet/create-wallet
Content-Type: application/json
```

```json
{
  "currency": "NGN",
  "isDefault": true
}
```

Setting `isDefault` to `true` removes the default status from the user's other wallets.

### 2. Fetch all wallets

Returns all wallets belonging to the authenticated user.

```http
GET /wallet/fetch-wallets
```

No payload is required.

### 3. Fetch wallet overview

Returns the selected wallet, all the user's wallets, and the default or latest payout bank account.

```http
GET /wallet/fetch-wallet-overview
```

Optional filters:

```http
GET /wallet/fetch-wallet-overview?currency=NGN
```

```http
GET /wallet/fetch-wallet-overview?walletId=WALLET_ID
```

When no filter is provided, the backend selects the default wallet or the user's first wallet.

### 4. Fetch one wallet

Returns one wallet and its payout bank account. The wallet must belong to the authenticated user.

```http
GET /wallet/fetch-wallet/WALLET_ID
```

No payload is required.

### 5. Set the default wallet

Makes the selected wallet the user's default wallet.

```http
PATCH /wallet/set-default-wallet/WALLET_ID
```

No payload is required.

## Wallet Funding

### 6. Fetch payment methods

Returns the available wallet funding methods: `Card` and `BankTransfer`.

```http
GET /wallet/fetch-payment-methods
```

No payload is required.

### 7. Fund a wallet by card

Creates a Paystack card payment and returns an authorization URL.

```http
POST /wallet/initiate-wallet-funding
Content-Type: application/json
```

```json
{
  "walletId": "WALLET_ID",
  "currency": "NGN",
  "amount": 5000,
  "paymentMethod": "Card",
  "redirectUrl": "https://your-frontend.com/wallet/payment-complete"
}
```

Redirect the user to the returned `authorizationUrl`. Paystack notifies the backend through its webhook, after which the frontend can reload the wallet overview and transaction history.

Card funding currently supports `NGN`. Always include `walletId`, even though validation currently marks it as optional.

### 8. Fund a wallet by bank transfer

Creates a pending manual bank-transfer funding request.

```http
POST /wallet/initiate-wallet-funding
Content-Type: multipart/form-data
```

Form fields:

```text
walletId=WALLET_ID
currency=NGN
amount=5000
paymentMethod=BankTransfer
image=RECEIPT_FILE
```

The receipt file field must be named `image`. An administrator must approve the request before the wallet is credited.

## Bank Accounts and Withdrawals

### 9. Fetch supported banks

Returns Nigerian banks and their Paystack bank codes.

```http
GET /wallet/fetch-banks
```

No payload is required.

### 10. Add a payout bank account

Verifies and saves a bank account for withdrawals.

```http
POST /wallet/add-bank-account
Content-Type: application/json
```

```json
{
  "bankCode": "044",
  "accountNumber": "0123456789",
  "currency": "NGN"
}
```

The account number must contain exactly 10 digits. The backend resolves the account name and creates the Paystack transfer recipient.

### 11. Fetch payout bank accounts

Returns the authenticated user's saved payout bank accounts.

```http
GET /wallet/fetch-bank-accounts
```

No payload is required.

### 12. Withdraw funds

Creates a withdrawal request to a saved bank account.

```http
POST /wallet/withdraw-funds
Content-Type: application/json
```

```json
{
  "walletId": "WALLET_ID",
  "bankAccountId": "BANK_ACCOUNT_ID",
  "currency": "NGN",
  "amount": 10000
}
```

The minimum withdrawal amount is `1000`. The requested amount is immediately held by removing it from the available balance. If the request is declined or the transfer fails, the amount is refunded.

## Wallet Transaction Endpoints

### 13. Fetch transaction history

Returns the user's paginated wallet and payment transactions.

```http
GET /transaction/fetch-all-user-transactions?page=1&limit=20
```

Example with filters:

```http
GET /transaction/fetch-all-user-transactions?page=1&limit=20&status=successful&type=inflow&currency=NGN&walletId=WALLET_ID&paymentMethod=Card&sortBy=date&sortOrder=desc&search=REFERENCE
```

Available filters:

```text
status: all | pending | failed | successful
type: inflow | outflow
paymentMethod: Card | BankTransfer | Wallet
currency: NGN | USD | GBP | EUR
sortBy: date | amount
sortOrder: asc | desc
page: minimum 1
limit: minimum 1, maximum 100
walletId: wallet ID
search: transaction reference, ID, description, or counterparty
```

### 14. Fetch one transaction

Returns one transaction belonging to or involving the authenticated user.

```http
GET /transaction/fetch-my-transaction/TRANSACTION_ID
```

No payload is required.

### 15. Fetch transaction summary

Returns the transaction count, total inflow, total outflow, percentage change, and monthly chart values.

```http
GET /transaction/fetch-transaction-summary?range=3M
```

Supported ranges:

```text
1M | 3M | 6M | 1Y
```

### 16. Fetch user earnings

Returns earnings, expenses, and monthly earnings statistics.

```http
GET /transaction/fetch-user-earning?year=2026
```

Optional month and currency filters:

```http
GET /transaction/fetch-user-earning?year=2026&month=11&currency=NGN
```

Always provide `year`. If `month` is supplied, the response does not include the twelve-month statistics array.

### 17. Download a transaction statement

Downloads the user's transaction statement as PDF or CSV.

```http
GET /transaction/download-statement?format=pdf
```

Example with filters:

```http
GET /transaction/download-statement?format=csv&startDate=2026-01-01&endDate=2026-12-31&status=successful&currency=NGN&walletId=WALLET_ID
```

Supported formats are `pdf` and `csv`. The response is a file rather than JSON.

### 18. Download a transaction receipt

Downloads the receipt for one transaction as PDF or CSV.

```http
GET /transaction/download-receipt/TRANSACTION_ID?format=pdf
```

```http
GET /transaction/download-receipt/TRANSACTION_ID?format=csv
```

The response is a file rather than JSON.

## Recommended Refreshes

After creating a wallet, adding a bank account, funding a wallet, or requesting a withdrawal, reload the relevant endpoints:

```text
GET /wallet/fetch-wallet-overview
GET /wallet/fetch-wallets
GET /wallet/fetch-bank-accounts
GET /transaction/fetch-all-user-transactions
GET /transaction/fetch-transaction-summary?range=3M
```
