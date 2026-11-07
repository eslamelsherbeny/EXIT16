# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security-and-logic-audit.spec.ts >> Aqar Exit — Senior Security, Logic & Full Pages Audit >> 4. اختبار اللوجيك المالي في صفحة الشراء (/buy): رفض الكاش الأكبر من الميزانية الكلية
- Location: tests\security-and-logic-audit.spec.ts:125:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-testid="buy-next-submit-btn"]').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - link "Aqar Exit" [ref=e5] [cursor=pointer]:
          - /url: /
        - navigation "القائمة الرئيسية" [ref=e18]:
          - link "بيع وحدتك" [ref=e19] [cursor=pointer]:
            - /url: /sell
          - link "الفرص المتاحة" [ref=e20] [cursor=pointer]:
            - /url: /opportunities
          - link "إزاي بنشتغل" [ref=e24] [cursor=pointer]:
            - /url: /how-it-works
          - link "قصتنا" [ref=e25] [cursor=pointer]:
            - /url: /story
          - link "كلمنا" [ref=e26] [cursor=pointer]:
            - /url: /contact
      - generic [ref=e27]:
        - link "المفضلة" [ref=e28] [cursor=pointer]:
          - /url: /account/favorites
        - button "AR" [ref=e32]
        - link "دخول" [ref=e40] [cursor=pointer]:
          - /url: /login
        - link "عايز تشتري" [ref=e45] [cursor=pointer]:
          - /url: /buy
        - link "عايز تبيع" [ref=e46] [cursor=pointer]:
          - /url: /sell
  - main [ref=e47]:
    - main [ref=e48]:
      - generic [ref=e49]:
        - generic [ref=e50]:
          - heading "اشتري بسعر التعاقد القديم" [level=1] [ref=e51]
          - paragraph [ref=e52]: سجّل قدرتك الشرائية — الكاش المتاح دلوقتي والقسط اللي يناسبك — وهنجيبلك الفرص المتحقق منها اللي تنفع معاك بالضبط.
        - generic [ref=e53]:
          - generic [ref=e54]: "كل فرصة بأرقام كاملة: المطلوب كاش، الأقساط المتبقية، ومواعيدها"
          - generic [ref=e58]: وحدات متحقق من عقودها ومدفوعاتها ومن حق النقل
          - generic [ref=e62]: بنمشي معاك في إجراءات النقل لحد التسجيل
          - generic [ref=e66]: عمولتنا 1.25% بس عند إتمام النقل — معلنة من الأول
          - generic [ref=e70]: "مشتريين بس: بنتعامل مع المشتري النهائي — مش بنقبل طلبات من سماسرة."
        - generic [ref=e74]:
          - generic [ref=e75]: بنتعامل مع المشتري نفسه بس
          - paragraph [ref=e80]: مش بنقبل طلبات من سماسرة بيدوروها للعميل. الوحدات دي بتتعرض للمشتري النهائي مباشرة، عشان السعر يفضل سعر التعاقد من غير أي زيادة.
        - generic [ref=e81]:
          - generic [ref=e82]:
            - heading "قدرتك الشرائية" [level=2] [ref=e83]
            - generic [ref=e84]: خطوة 1 من 3
          - generic [ref=e90]:
            - generic [ref=e91]:
              - generic [ref=e92]:
                - text: الكاش المتاح معاك دلوقتي
                - generic [ref=e93]: "*"
              - generic [ref=e94]:
                - textbox "0" [ref=e95]: 120,000
                - generic: $
              - generic [ref=e96]: 120 ألف $
            - group "نظام القسط *" [ref=e97]:
              - generic [ref=e99]:
                - generic [ref=e100] [cursor=pointer]:
                  - generic [ref=e101]: شهري
                  - radio "شهري" [checked] [ref=e102]
                - generic [ref=e103] [cursor=pointer]:
                  - generic [ref=e104]: ربع سنوي (كل 3 شهور)
                  - radio "ربع سنوي (كل 3 شهور)" [ref=e105]
                - generic [ref=e106] [cursor=pointer]:
                  - generic [ref=e107]: نصف سنوي
                  - radio "نصف سنوي" [ref=e108]
                - generic [ref=e109] [cursor=pointer]:
                  - generic [ref=e110]: سنوي
                  - radio "سنوي" [ref=e111]
            - generic [ref=e112]:
              - generic [ref=e113]:
                - text: أقصى قسط يريحك
                - generic [ref=e114]: "*"
              - generic [ref=e115]:
                - textbox "0" [ref=e116]: 1,000
                - generic: $
              - generic [ref=e117]: 1 ألف $
            - generic [ref=e118]:
              - generic [ref=e119]:
                - text: سعر التعاقد المستهدف (الميزانية)
                - generic [ref=e120]: "*"
              - generic [ref=e121]:
                - textbox "0" [active] [ref=e122]: 80,000
                - generic: $
              - generic [ref=e123]: 80 ألف $
          - button "كمل" [ref=e125]
        - generic [ref=e126]:
          - generic [ref=e127]: كلمنا على واتساب وقولنا بتدور على إيه
          - link "سجّل اهتمامك دلوقتي" [ref=e132] [cursor=pointer]:
            - /url: https://wa.me/201098865314
  - contentinfo [ref=e136]:
    - generic [ref=e137]:
      - generic [ref=e138]:
        - generic [ref=e139]:
          - link "Aqar Exit" [ref=e140] [cursor=pointer]:
            - /url: /
          - paragraph [ref=e153]: منصة التنازل عن وحدات التقسيط بدون أوفر — البايع يسترجع فلوسه كاش، والمشتري ياخد سعر التعاقد القديم، وإحنا بنسهّل الإجراءات خطوة بخطوة
          - generic [ref=e154]:
            - link "+201098865314" [ref=e155] [cursor=pointer]:
              - /url: tel:+201098865314
            - link "واتساب" [ref=e156] [cursor=pointer]:
              - /url: https://wa.me/201098865314
            - link "info@aqarexit.com" [ref=e157] [cursor=pointer]:
              - /url: mailto:info@aqarexit.com
        - generic [ref=e158]:
          - heading "المنصة" [level=3] [ref=e159]
          - list [ref=e160]:
            - listitem [ref=e161]:
              - link "الفرص المتاحة" [ref=e162] [cursor=pointer]:
                - /url: /opportunities
            - listitem [ref=e163]:
              - link "للبايعين (بيع وحدتك)" [ref=e164] [cursor=pointer]:
                - /url: /sell
            - listitem [ref=e165]:
              - link "للمشترين (اطلب وحدة)" [ref=e166] [cursor=pointer]:
                - /url: /buy
            - listitem [ref=e167]:
              - link "حاسبة الخروج" [ref=e168] [cursor=pointer]:
                - /url: /calculator
            - listitem [ref=e169]:
              - link "المفضلة" [ref=e170] [cursor=pointer]:
                - /url: /account/favorites
            - listitem [ref=e171]:
              - link "دخول" [ref=e172] [cursor=pointer]:
                - /url: /login
        - generic [ref=e173]:
          - heading "الشركة" [level=3] [ref=e174]
          - list [ref=e175]:
            - listitem [ref=e176]:
              - link "قصتنا" [ref=e177] [cursor=pointer]:
                - /url: /story
            - listitem [ref=e178]:
              - link "إزاي بنشتغل" [ref=e179] [cursor=pointer]:
                - /url: /how-it-works
            - listitem [ref=e180]:
              - link "التقارير والمؤشرات" [ref=e181] [cursor=pointer]:
                - /url: /reports
            - listitem [ref=e182]:
              - link "الأسئلة الشائعة" [ref=e183] [cursor=pointer]:
                - /url: /faq
            - listitem [ref=e184]:
              - link "كلمنا" [ref=e185] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e186]:
          - heading "قانوني" [level=3] [ref=e187]
          - list [ref=e188]:
            - listitem [ref=e189]:
              - link "سياسة الخصوصية" [ref=e190] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e191]:
              - link "الشروط والأحكام" [ref=e192] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e193]:
              - link "لوحة الإدارة" [ref=e194] [cursor=pointer]:
                - /url: /admin
      - generic [ref=e195]:
        - generic [ref=e196]:
          - generic [ref=e197]: أسواق العمل
          - generic [ref=e198]:
            - generic [ref=e199]: جورجيا
            - generic [ref=e206]:
              - generic [ref=e212]: مصر
              - generic [ref=e213]: قريباً
            - generic [ref=e214]:
              - generic [ref=e220]: الإمارات
              - generic [ref=e221]: قريباً
            - generic [ref=e222]:
              - generic [ref=e227]: روسيا
              - generic [ref=e228]: قريباً
        - paragraph [ref=e229]: الأرقام والتقديرات المعروضة على المنصة استرشادية وتعتمد على بنود كل عقد على حدة، ولا تعتبر استشارة قانونية أو وعدًا بنتيجة محددة. المراجعة النهائية بتتم على عقدك الفعلي مع فريقنا ومستشارين قانونيين مؤهلين.
  - region "Notifications alt+T"
  - generic [ref=e234] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e235]
    - generic [ref=e239]:
      - button "Open issues overlay" [ref=e240]:
        - generic [ref=e241]:
          - generic [aria-hidden] [ref=e242]: "0"
          - generic [ref=e243]: "1"
        - generic [ref=e244]: Insight
      - button "Collapse issues badge" [ref=e245]
  - alert [ref=e248]
```

# Test source

```ts
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
  47  |       ).toBeLessThan(400)
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
> 137 |     await nextBtn.click()
      |                   ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  155 |     await expect(page).toHaveURL(/\/account/, { timeout: 20000 })
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