# Task: Merchant-Side Pages Development

## Agent: Main Developer

## Summary
Built all merchant-side pages and API routes for the 邵东选品平台 (Shaodong Product Selection Platform) B2B platform.

## Files Created/Modified

### API Routes (9 files)
- `src/app/api/merchant/stats/route.ts` - Dashboard statistics API (GET)
- `src/app/api/merchant/products/route.ts` - Products list/create API (GET, POST)
- `src/app/api/merchant/products/[id]/route.ts` - Product detail/update/delete API (GET, PUT, DELETE)
- `src/app/api/merchant/inquiries/route.ts` - Inquiries list API (GET)
- `src/app/api/merchant/inquiries/[id]/route.ts` - Inquiry detail/reply/convert/close API (GET, PUT)
- `src/app/api/merchant/orders/route.ts` - Orders list API (GET)
- `src/app/api/merchant/orders/[id]/route.ts` - Order detail/confirm/dispatch API (GET, PUT)
- `src/app/api/merchant/shop/route.ts` - Shop info get/update API (GET, PUT)
- `src/app/api/merchant/account/route.ts` - Account balance/withdrawals API (GET, POST)

### Pages (12 files)
- `src/app/(merchant)/merchant/dashboard/page.tsx` - Dashboard with stats, chart, top products, balance
- `src/app/(merchant)/merchant/products/page.tsx` - Product list with tabs, table, actions
- `src/app/(merchant)/merchant/products/product-form.tsx` - Shared product form component (4-step wizard)
- `src/app/(merchant)/merchant/products/create/page.tsx` - Create product page
- `src/app/(merchant)/merchant/products/[id]/edit/page.tsx` - Edit product page
- `src/app/(merchant)/merchant/inquiries/page.tsx` - Inquiry list with tabs and cards
- `src/app/(merchant)/merchant/inquiries/[id]/page.tsx` - Inquiry detail with reply form
- `src/app/(merchant)/merchant/orders/page.tsx` - Order list with tabs and table
- `src/app/(merchant)/merchant/orders/[id]/page.tsx` - Order detail with timeline and actions
- `src/app/(merchant)/merchant/settings/shop/page.tsx` - Shop settings form
- `src/app/(merchant)/merchant/settings/account/page.tsx` - Account & withdrawal page
- `src/app/(merchant)/merchant/shop/page.tsx` - Redirect to /merchant/settings/shop
- `src/app/(merchant)/merchant/account/page.tsx` - Redirect to /merchant/settings/account

### Modified Files
- `src/components/shared/merchant-layout.tsx` - Updated sidebar navigation (teal/green theme, new routes)

## Key Design Decisions
1. **Teal/Green accent** - Changed from orange to teal/emerald for merchant branding
2. **4-step product form** - Multi-step wizard for creating/editing products
3. **Settings URL structure** - Changed from `/merchant/shop` to `/merchant/settings/shop` with redirects
4. **Shared product form component** - Reused between create and edit pages
5. **API security** - All APIs verify auth and merchant role, ensure data isolation
6. **Status workflow** - Inquiries: pending → replied → converted/closed; Orders: pending_payment → paid → in_warehouse → dispatched → delivered

## Lint Status
✅ All files pass ESLint checks
