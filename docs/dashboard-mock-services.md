# Dashboard Mock Services & Fixtures

## 1. Overview

The Dashboard mock architecture simulates enterprise backend responses while running entirely on the frontend during Sprint 2. It ensures realistic latency (150ms), cancelable asynchronous requests, and 100% deterministic mathematical integrity.

## 2. Fixture Datasets

- **`MOCK_TRANSACTIONS`**:
  - Contains confirmed sales transactions across October 2026.
  - Granular line items detailing `productId`, `productName`, `category`, `quantity`, and `unitPrice`.
  - Transaction statuses: `Selesai`, `Diproses`, `Menunggu`.
- **`MOCK_STOCK_ITEMS`**:
  - Materials and hardware items in inventory.
  - Details: `materialName`, `warehouse`, `currentStock`, `minimumLimit`, and `unit`.
  - Items with `currentStock <= minimumLimit` trigger low stock warnings.

## 3. Mathematical Consistency Rules

All analytical aggregations derive from the filtered subset of `MOCK_TRANSACTIONS`:

1. `Summary.totalTransactionsAmount` $\equiv \sum \text{SalesChartPoint.amount}$.
2. `Summary.totalTransactionsCount` $\equiv \sum \text{SalesChartPoint.count}$.
3. Top Spenders total expenditure corresponds directly to customer transactions in the selected period.
4. Recent transactions list displays up to 10 latest orders sorted by date and ID descending.
