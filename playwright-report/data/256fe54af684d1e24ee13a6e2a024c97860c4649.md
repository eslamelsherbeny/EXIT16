# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security-and-logic-audit.spec.ts >> Aqar Exit — Senior Security, Logic & Full Pages Audit >> 5. اختبار اللوجيك المالي والهندسي في صفحة البيع (/sell): رفض المدفوع الأكبر من سعر العقد
- Location: tests\security-and-logic-audit.spec.ts:148:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/account/
Received string:  "http://localhost:3000/login"
Timeout: 20000ms

Call log:
  - Expect "toHaveURL" with timeout 20000ms
    43 × locator resolved to <html lang="ar" dir="rtl">…</html>
       - unexpected value "http://localhost:3000/login"

```

```yaml
- banner:
  - link "Aqar Exit":
    - /url: /
    - img
  - navigation "القائمة الرئيسية":
    - link "بيع وحدتك":
      - /url: /sell
    - link "الفرص المتاحة":
      - /url: /opportunities
    - link "إزاي بنشتغل":
      - /url: /how-it-works
    - link "قصتنا":
      - /url: /story
    - link "كلمنا":
      - /url: /contact
  - link "المفضلة":
    - /url: /account/favorites
  - button "AR"
  - link "دخول":
    - /url: /login
  - link "عايز تشتري":
    - /url: /buy
  - link "عايز تبيع":
    - /url: /sell
- main:
  - heading "تسجيل الدخول" [level=1]
  - paragraph: أهلاً بيك تاني في دارك
  - alert: يرجى الانتظار لحظات حتى يكتمل التحقق الأمني (Cloudflare) بالأسفل ثم اضغط تسجيل الدخول.
  - text: البريد الإلكتروني أو رقم الموبايل
  - textbox "البريد الإلكتروني أو رقم الموبايل":
    - /placeholder: name@example.com أو 01xxxxxxxxx
    - text: ahmedelsherbeny317@gmail.com
  - text: كلمة السر
  - link "نسيت كلمة السر؟":
    - /url: /reset-password
  - textbox "كلمة السر":
    - /placeholder: ••••••••
    - text: Eslam1995@
  - button "إظهار كلمة السر"
  - text: تم التحقق بنجاح! CLOUDFLARE
  - link "الخصوصية":
    - /url: /privacy
  - text: •
  - link "الشروط":
    - /url: /terms
  - button "تسجيل الدخول"
  - paragraph:
    - text: معندكش حساب؟
    - link "سجل دلوقتي":
      - /url: /register
- region "Notifications alt+T"
- alert
```

# Test source

```ts
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
  148 |   test('5. اختبار اللوجيك المالي والهندسي في صفحة البيع (/sell): رفض المدفوع الأكبر من سعر العقد', async ({
  149 |     page,
  150 |   }) => {
  151 |     await page.goto('/login')
  152 |     await page.fill('#emailOrPhone', SELLER_ACCOUNT.email)
  153 |     await page.fill('#password', SELLER_ACCOUNT.password)
  154 |     await page.locator('button[type="submit"]').click()
> 155 |     await expect(page).toHaveURL(/\/account/, { timeout: 20000 })
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  156 | 
  157 |     await page.goto('/sell')
  158 |     await page
  159 |       .locator('section')
  160 |       .first()
  161 |       .waitFor({ state: 'visible', timeout: 25000 })
  162 | 
  163 |     // فتح نوع العقار
  164 |     const firstSection = page.locator('section').nth(0)
  165 |     await firstSection.locator('button').first().click()
  166 |     await page.waitForTimeout(300)
  167 |     const statusBtns = firstSection.locator('button')
  168 |     if ((await statusBtns.count()) > 6) await statusBtns.nth(6).click()
  169 | 
  170 |     // إدخال سعر عقد ($50,000) ومبلغ مدفوع أكبر منه ($85,000) — تناقض مالي!
  171 |     const pricingSection = page.locator('section').nth(4)
  172 |     const moneyInputs = pricingSection.locator('input[placeholder="0"]')
  173 |     await moneyInputs.nth(0).fill('50000') // سعر العقد
  174 |     await moneyInputs.nth(1).fill('85000') // المدفوع أكبر من العقد!
  175 | 
  176 |     const publishBtn = page.locator('div.fixed.bottom-0 button').last()
  177 |     await publishBtn.click({ force: true })
  178 |     await page.waitForTimeout(1000)
  179 | 
  180 |     // يجب أن يرفض النشر ويبقى في صفحة /sell
  181 |     await expect(page).toHaveURL(/\/sell/)
  182 |     console.log('✅ اللوجيك المالي في صفحة /sell يمنع نشر وحدة مدفوعها أكبر من سعر عقدها!')
  183 |   })
  184 | 
  185 |   test('6. اختبار الحماية ضد حقن الأكواد الخبيثة (XSS Injection) في البحث والفلاتر', async ({
  186 |     page,
  187 |   }) => {
  188 |     let xssTriggered = false
  189 |     page.on('dialog', () => {
  190 |       xssTriggered = true
  191 |     })
  192 | 
  193 |     await page.goto(
  194 |       '/opportunities?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E'
  195 |     )
  196 |     await page.waitForTimeout(1500)
  197 | 
  198 |     expect(xssTriggered, '🚨 ثغرة XSS خطيرة في صفحة الفرص!').toBe(false)
  199 |     console.log('✅ حماية XSS في محرك البحث والـ URL تعمل بنجاح!')
  200 |   })
  201 | })
```