# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security-and-logic-audit.spec.ts >> Aqar Exit — Senior Security, Logic & Full Pages Audit >> 1. فحص جميع صفحات الموقع الداخلية والتأكد من خلوها من أخطاء الكونسول والسيرفر
- Location: tests\security-and-logic-audit.spec.ts:20:3

# Error details

```
Error: ❌ الصفحة /reports لا تفتح وترجع كود 404

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

# Page snapshot

```yaml
- generic [active] [ref=f7e1]:
  - generic [ref=f7e3]:
    - heading "404" [level=1] [ref=f7e4]
    - heading "This page could not be found." [level=2] [ref=f7e6]
  - region "Notifications alt+T"
  - generic [ref=f7e11] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=f7e12]
    - generic [ref=f7e16]:
      - button "Open issues overlay" [ref=f7e17]:
        - generic [ref=f7e18]:
          - generic [aria-hidden] [ref=f7e19]: "0"
          - generic [ref=f7e20]: "1"
        - generic [ref=f7e21]: Insight
      - button "Collapse issues badge" [ref=f7e22]
  - alert [ref=f7e25]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const ADMIN_ACCOUNT = {
  4   |   email: 'eslamelsherbeny17@gmail.com',
  5   |   password: 'Eslam1995@',
  6   | }
  7   | 
  8   | const BUYER_ACCOUNT = {
  9   |   email: 'eslamelsherbeny1995@gmail.com',
  10  |   password: 'Eslam1995@',
  11  | }
  12  | 
  13  | const SELLER_ACCOUNT = {
  14  |   email: 'ahmedelsherbeny317@gmail.com',
  15  |   password: 'Eslam1995@',
  16  |   phoneFragment: '1125874236', // جزء من رقم البائع للتأكد من عدم تسربه للجمهور
  17  | }
  18  | 
  19  | test.describe('Aqar Exit — Senior Security, Logic & Full Pages Audit', () => {
  20  |   test('1. فحص جميع صفحات الموقع الداخلية والتأكد من خلوها من أخطاء الكونسول والسيرفر', async ({
  21  |     page,
  22  |   }) => {
  23  |     const pageErrors: string[] = []
  24  |     page.on('pageerror', (err) => pageErrors.push(err.message))
  25  | 
  26  |     const allPublicRoutes = [
  27  |       '/',
  28  |       '/opportunities',
  29  |       '/sell',
  30  |       '/buy',
  31  |       '/calculator',
  32  |       '/how-it-works',
  33  |       '/story',
  34  |       '/reports',
  35  |       '/faq',
  36  |       '/contact',
  37  |       '/privacy',
  38  |       '/terms',
  39  |       '/login',
  40  |     ]
  41  | 
  42  |     for (const route of allPublicRoutes) {
  43  |       const res = await page.goto(route, { waitUntil: 'domcontentloaded' })
  44  |       expect(
  45  |         res?.status(),
  46  |         `❌ الصفحة ${route} لا تفتح وترجع كود ${res?.status()}`
> 47  |       ).toBeLessThan(400)
      |         ^ Error: ❌ الصفحة /reports لا تفتح وترجع كود 404
  48  | 
  49  |       const hasRuntimeCrash = await page
  50  |         .locator('text=/Unhandled Runtime Error|Application error|ENOENT/i')
  51  |         .count()
  52  |       expect(hasRuntimeCrash, `❌ الصفحة ${route} بها خطأ برمجي قاتل`).toBe(0)
  53  |       console.log(`✅ الصفحة سليمة: ${route}`)
  54  |     }
  55  | 
  56  |     expect(
  57  |       pageErrors,
  58  |       `⚠️ ظهرت أخطاء جافاسكربت في الكونسول: ${pageErrors.join(' | ')}`
  59  |     ).toHaveLength(0)
  60  |   })
  61  | 
  62  |   test('2. اختبار اختراق الصلاحيات (Authorization): منع الزائر والمشتري العادي من فتح لوحة الأدمن', async ({
  63  |     page,
  64  |   }) => {
  65  |     // أ) محاولة دخول زائر غير مسجل إلى لوحة الإدارة
  66  |     await page.context().clearCookies()
  67  |     await page.goto('/admin/properties')
  68  |     await page.waitForTimeout(1000)
  69  |     const guestUrl = page.url()
  70  |     const guestBody = await page.locator('body').textContent()
  71  | 
  72  |     // يجب إما تحويله لصفحة الدخول أو إظهار عدم التصريح، وعدم عرض أزرار الحذف والتفعيل الإدارية
  73  |     const canGuestSeeAdminDelete = await page
  74  |       .locator('button:has-text("حذف المستخدم"), button:has-text("Purge")')
  75  |       .count()
  76  |     expect(
  77  |       canGuestSeeAdminDelete,
  78  |       '🚨 ثغرة خطيرة: الزائر يستطيع رؤية أدوات الأدمن!'
  79  |     ).toBe(0)
  80  |     console.log('✅ حماية الزائر على /admin تعمل بنجاح (URL:', guestUrl, ')')
  81  | 
  82  |     // ب) تسجيل دخول كمشتري عادي ومحاولة فتح /admin/users
  83  |     await page.goto('/login')
  84  |     await page.fill('#emailOrPhone', BUYER_ACCOUNT.email)
  85  |     await page.fill('#password', BUYER_ACCOUNT.password)
  86  |     await page.locator('button[type="submit"]').click()
  87  |     await expect(page).toHaveURL(/\/account/, { timeout: 20000 })
  88  | 
  89  |     await page.goto('/admin/users')
  90  |     await page.waitForTimeout(1500)
  91  |     // التأكد أن المشتري العادي لا يستطيع تغيير رتب المستخدمين أو مسحهم
  92  |     const adminCreateUserBtn = await page
  93  |       .locator('input[name="role"], button:has-text("إضافة موظف")')
  94  |       .count()
  95  |     expect(
  96  |       adminCreateUserBtn,
  97  |       '🚨 ثغرة خطيرة: المشتري العادي يستطيع الوصول لإدارة الموظفين!'
  98  |     ).toBe(0)
  99  |     console.log('✅ عزل صلاحيات المشتري العادي عن لوحة الإدارة سليم!')
  100 |   })
  101 | 
  102 |   test('3. اختبار تسريب بيانات المالك (Data Leak): التأكد أن رقم وإيميل البائع مخفيان تماماً في صفحة الوحدة', async ({
  103 |     page,
  104 |   }) => {
  105 |     await page.goto('/opportunities')
  106 |     const firstUnit = page.locator('a[href^="/opportunities/"]').first()
  107 |     await expect(firstUnit).toBeVisible({ timeout: 15000 })
  108 |     await firstUnit.click()
  109 |     await page.waitForLoadState('networkidle')
  110 | 
  111 |     const htmlContent = await page.content()
  112 | 
  113 |     // يجب ألا يظهر رقم هاتف البائع أو إيميله في الـ HTML العام للصفحة لحماية عمولة المنصة
  114 |     expect(
  115 |       htmlContent.includes(SELLER_ACCOUNT.email),
  116 |       '🚨 تسريب بيانات: إيميل البائع ظاهر في كود صفحة الوحدة!'
  117 |     ).toBe(false)
  118 |     expect(
  119 |       htmlContent.includes(SELLER_ACCOUNT.phoneFragment),
  120 |       '🚨 تسريب بيانات: رقم هاتف البائع ظاهر في كود صفحة الوحدة!'
  121 |     ).toBe(false)
  122 |     console.log('✅ حماية خصوصية رقم وإيميل البائع ومنع الالتفاف على العمولة سليمة 100%!')
  123 |   })
  124 | 
  125 |   test('4. اختبار اللوجيك المالي في صفحة الشراء (/buy): رفض الكاش الأكبر من الميزانية الكلية', async ({
  126 |     page,
  127 |   }) => {
  128 |     await page.goto('/buy')
  129 |     const inputs = page.locator('input[inputmode="numeric"]')
  130 | 
  131 |     // إدخال كاش متاح (120,000$) أكبر من إجمالي الميزانية (80,000$) — خطأ منطقي يجب أن يرفضه الموقع
  132 |     await inputs.nth(0).fill('120000') // الكاش المتاح
  133 |     await inputs.nth(1).fill('1000') // القسط
  134 |     await inputs.nth(2).fill('80000') // إجمالي الميزانية (أقل من الكاش!)
  135 | 
  136 |     const nextBtn = page.locator('[data-testid="buy-next-submit-btn"]').first()
  137 |     await nextBtn.click()
  138 | 
  139 |     // يجب ألا ينتقل للخطوة 2، ويجب أن يظهر تنبيه الخطأ الأحمر (role="alert")
  140 |     const alertBox = page.locator('[role="alert"]').first()
  141 |     await expect(
  142 |       alertBox,
  143 |       '❌ خطأ لوجيك في /buy: الموقع قبل كاش متاح أكبر من إجمالي الميزانية!'
  144 |     ).toBeVisible()
  145 |     console.log('✅ اللوجيك المالي في صفحة /buy يرفض الأرقام المتناقضة بنجاح!')
  146 |   })
  147 | 
```