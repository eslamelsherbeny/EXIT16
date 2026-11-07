import { test, expect } from '@playwright/test'

const ADMIN_ACCOUNT = {
  email: 'eslamelsherbeny17@gmail.com',
  password: 'Eslam1995@',
}

const BUYER_ACCOUNT = {
  email: 'eslamelsherbeny1995@gmail.com',
  password: 'Eslam1995@',
}

const SELLER_ACCOUNT = {
  email: 'ahmedelsherbeny317@gmail.com',
  password: 'Eslam1995@',
  phoneFragment: '1125874236', // جزء من رقم البائع للتأكد من عدم تسربه للجمهور
}

test.describe('Aqar Exit — Senior Security, Logic & Full Pages Audit', () => {
  test('1. فحص جميع صفحات الموقع الداخلية والتأكد من خلوها من أخطاء الكونسول والسيرفر', async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    const allPublicRoutes = [
      '/',
      '/opportunities',
      '/sell',
      '/buy',
      '/calculator',
      '/how-it-works',
      '/story',
      '/reports',
      '/faq',
      '/contact',
      '/privacy',
      '/terms',
      '/login',
    ]

    for (const route of allPublicRoutes) {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(
        res?.status(),
        `❌ الصفحة ${route} لا تفتح وترجع كود ${res?.status()}`
      ).toBeLessThan(400)

      const hasRuntimeCrash = await page
        .locator('text=/Unhandled Runtime Error|Application error|ENOENT/i')
        .count()
      expect(hasRuntimeCrash, `❌ الصفحة ${route} بها خطأ برمجي قاتل`).toBe(0)
      console.log(`✅ الصفحة سليمة: ${route}`)
    }

    expect(
      pageErrors,
      `⚠️ ظهرت أخطاء جافاسكربت في الكونسول: ${pageErrors.join(' | ')}`
    ).toHaveLength(0)
  })

  test('2. اختبار اختراق الصلاحيات (Authorization): منع الزائر والمشتري العادي من فتح لوحة الأدمن', async ({
    page,
  }) => {
    // أ) محاولة دخول زائر غير مسجل إلى لوحة الإدارة
    await page.context().clearCookies()
    await page.goto('/admin/properties')
    await page.waitForTimeout(1000)
    const guestUrl = page.url()
    const guestBody = await page.locator('body').textContent()

    // يجب إما تحويله لصفحة الدخول أو إظهار عدم التصريح، وعدم عرض أزرار الحذف والتفعيل الإدارية
    const canGuestSeeAdminDelete = await page
      .locator('button:has-text("حذف المستخدم"), button:has-text("Purge")')
      .count()
    expect(
      canGuestSeeAdminDelete,
      '🚨 ثغرة خطيرة: الزائر يستطيع رؤية أدوات الأدمن!'
    ).toBe(0)
    console.log('✅ حماية الزائر على /admin تعمل بنجاح (URL:', guestUrl, ')')

    // ب) تسجيل دخول كمشتري عادي ومحاولة فتح /admin/users
    await page.goto('/login')
    await page.fill('#emailOrPhone', BUYER_ACCOUNT.email)
    await page.fill('#password', BUYER_ACCOUNT.password)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/account/, { timeout: 20000 })

    await page.goto('/admin/users')
    await page.waitForTimeout(1500)
    // التأكد أن المشتري العادي لا يستطيع تغيير رتب المستخدمين أو مسحهم
    const adminCreateUserBtn = await page
      .locator('input[name="role"], button:has-text("إضافة موظف")')
      .count()
    expect(
      adminCreateUserBtn,
      '🚨 ثغرة خطيرة: المشتري العادي يستطيع الوصول لإدارة الموظفين!'
    ).toBe(0)
    console.log('✅ عزل صلاحيات المشتري العادي عن لوحة الإدارة سليم!')
  })

  test('3. اختبار تسريب بيانات المالك (Data Leak): التأكد أن رقم وإيميل البائع مخفيان تماماً في صفحة الوحدة', async ({
    page,
  }) => {
    await page.goto('/opportunities')
    const firstUnit = page.locator('a[href^="/opportunities/"]').first()
    await expect(firstUnit).toBeVisible({ timeout: 15000 })
    await firstUnit.click()
    await page.waitForLoadState('networkidle')

    const htmlContent = await page.content()

    // يجب ألا يظهر رقم هاتف البائع أو إيميله في الـ HTML العام للصفحة لحماية عمولة المنصة
    expect(
      htmlContent.includes(SELLER_ACCOUNT.email),
      '🚨 تسريب بيانات: إيميل البائع ظاهر في كود صفحة الوحدة!'
    ).toBe(false)
    expect(
      htmlContent.includes(SELLER_ACCOUNT.phoneFragment),
      '🚨 تسريب بيانات: رقم هاتف البائع ظاهر في كود صفحة الوحدة!'
    ).toBe(false)
    console.log('✅ حماية خصوصية رقم وإيميل البائع ومنع الالتفاف على العمولة سليمة 100%!')
  })

  test('4. اختبار اللوجيك المالي في صفحة الشراء (/buy): رفض الكاش الأكبر من الميزانية الكلية', async ({
    page,
  }) => {
    await page.goto('/buy')
    const inputs = page.locator('input[inputmode="numeric"]')

    // إدخال كاش متاح (120,000$) أكبر من إجمالي الميزانية (80,000$) — خطأ منطقي يجب أن يرفضه الموقع
    await inputs.nth(0).fill('120000') // الكاش المتاح
    await inputs.nth(1).fill('1000') // القسط
    await inputs.nth(2).fill('80000') // إجمالي الميزانية (أقل من الكاش!)

    const nextBtn = page.locator('[data-testid="buy-next-submit-btn"]').first()
    await nextBtn.click()

    // يجب ألا ينتقل للخطوة 2، ويجب أن يظهر تنبيه الخطأ الأحمر (role="alert")
    const alertBox = page.locator('[role="alert"]').first()
    await expect(
      alertBox,
      '❌ خطأ لوجيك في /buy: الموقع قبل كاش متاح أكبر من إجمالي الميزانية!'
    ).toBeVisible()
    console.log('✅ اللوجيك المالي في صفحة /buy يرفض الأرقام المتناقضة بنجاح!')
  })

  test('5. اختبار اللوجيك المالي والهندسي في صفحة البيع (/sell): رفض المدفوع الأكبر من سعر العقد', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.fill('#emailOrPhone', SELLER_ACCOUNT.email)
    await page.fill('#password', SELLER_ACCOUNT.password)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/account/, { timeout: 20000 })

    await page.goto('/sell')
    await page
      .locator('section')
      .first()
      .waitFor({ state: 'visible', timeout: 25000 })

    // فتح نوع العقار
    const firstSection = page.locator('section').nth(0)
    await firstSection.locator('button').first().click()
    await page.waitForTimeout(300)
    const statusBtns = firstSection.locator('button')
    if ((await statusBtns.count()) > 6) await statusBtns.nth(6).click()

    // إدخال سعر عقد ($50,000) ومبلغ مدفوع أكبر منه ($85,000) — تناقض مالي!
    const pricingSection = page.locator('section').nth(4)
    const moneyInputs = pricingSection.locator('input[placeholder="0"]')
    await moneyInputs.nth(0).fill('50000') // سعر العقد
    await moneyInputs.nth(1).fill('85000') // المدفوع أكبر من العقد!

    const publishBtn = page.locator('div.fixed.bottom-0 button').last()
    await publishBtn.click({ force: true })
    await page.waitForTimeout(1000)

    // يجب أن يرفض النشر ويبقى في صفحة /sell
    await expect(page).toHaveURL(/\/sell/)
    console.log('✅ اللوجيك المالي في صفحة /sell يمنع نشر وحدة مدفوعها أكبر من سعر عقدها!')
  })

  test('6. اختبار الحماية ضد حقن الأكواد الخبيثة (XSS Injection) في البحث والفلاتر', async ({
    page,
  }) => {
    let xssTriggered = false
    page.on('dialog', () => {
      xssTriggered = true
    })

    await page.goto(
      '/opportunities?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E'
    )
    await page.waitForTimeout(1500)

    expect(xssTriggered, '🚨 ثغرة XSS خطيرة في صفحة الفرص!').toBe(false)
    console.log('✅ حماية XSS في محرك البحث والـ URL تعمل بنجاح!')
  })
})