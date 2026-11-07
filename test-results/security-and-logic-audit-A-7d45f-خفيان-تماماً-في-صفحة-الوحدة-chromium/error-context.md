# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security-and-logic-audit.spec.ts >> Aqar Exit — Senior Security, Logic & Full Pages Audit >> 3. اختبار تسريب بيانات المالك (Data Leak): التأكد أن رقم وإيميل البائع مخفيان تماماً في صفحة الوحدة
- Location: tests\security-and-logic-audit.spec.ts:102:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - link "رجوع للفرص" [ref=e51] [cursor=pointer]:
          - /url: /opportunities
        - generic [ref=e55]:
          - generic [ref=e56]:
            - heading "King David Residences" [level=1] [ref=e57]
            - paragraph [ref=e58]: 📍 King David Development · تبليسي — سابورتالو (Saburtalo) · Merab Aleksidze St 12
            - generic [ref=e59]:
              - button "U-15876" [ref=e60]
              - generic [ref=e65]:
                - generic [ref=e66]: "الرقم العقاري (NAPR):"
                - generic [ref=e67]: 01.10.14.022.001
          - generic [ref=e68]:
            - generic [ref=e69]: متحقق بالمستندات
            - generic [ref=e70]: عليها عرض نشط
            - generic [ref=e74]: مميزة
            - button "مشاركة" [ref=e78]
            - button "أضف للمفضلة" [ref=e86]
        - generic [ref=e90]:
          - generic [ref=e92] [cursor=pointer]:
            - img "King David Residences — صورة 1" [ref=e93]
            - generic: SUPER VIP
            - generic: اضغط لتكبير الصور
            - generic [ref=e94]: 1 / 1
          - generic [ref=e96]:
            - generic [ref=e97]:
              - generic [ref=e98]: منذ 4 ساعات
              - generic [ref=e102]: "|"
              - generic [ref=e107]:
                - strong [ref=e108]: "7"
                - text: مشاهدة
            - 'button "ID: U-15876" [ref=e109]'
        - generic [ref=e114]:
          - generic [ref=e119]:
            - strong [ref=e120]: شقة
            - generic [ref=e121]: النوع
          - generic [ref=e128]:
            - strong [ref=e129]: 85 م²
            - generic [ref=e130]: المساحة
          - generic [ref=e136]:
            - strong [ref=e137]: 14/32
            - generic [ref=e138]: الطابق
          - generic [ref=e143]:
            - strong [ref=e144]: 2 (1 🛏)
            - generic [ref=e145]: الغرف (النوم)
          - generic [ref=e150]:
            - strong [ref=e151]: "2"
            - generic [ref=e152]: الحمامات
          - generic [ref=e158]:
            - strong [ref=e159]: تشطيب كامل (Turnkey)
            - generic [ref=e160]: التشطيب
          - generic [ref=e165]:
            - strong [ref=e166]: جاهزة للاستلام
            - generic [ref=e167]: حالة الاستلام
          - generic [ref=e171]:
            - strong [ref=e172]: "2024"
            - generic [ref=e173]: تاريخ التعاقد
          - generic [ref=e177]:
            - strong [ref=e178]: 1,118 $
            - generic [ref=e179]: سعر المتر بالعقد
        - generic [ref=e180]:
          - heading "وصف الوحدة والتفاصيل" [level=2] [ref=e181]
          - paragraph [ref=e182]: شقة فاخرة بإطلالة بانورامية في قلب سابورتالو تبليسي، البيع بنفس سعر العقد الأصلي بدون أوفر.
        - generic [ref=e183]:
          - generic [ref=e184]: مؤشر تقييم الفرصة (AQAR EXIT SCORE)
          - generic [ref=e189]:
            - generic [ref=e191]:
              - strong [ref=e192]: "93"
              - text: /100
            - generic [ref=e193]:
              - heading "فرصة استثنائية" [level=3] [ref=e194]
              - paragraph [ref=e195]: محسوب تلقائياً من سعر المتر ($1118/م²) وموقع وحالة الوحدة
          - generic [ref=e196]:
            - generic [ref=e198]:
              - generic [ref=e199]: السعر مقارنة بمتوسط المنطقة
              - strong [ref=e200]: "-21%"
            - generic [ref=e204]:
              - generic [ref=e205]: تقييم الموقع والخدمات
              - strong [ref=e206]: 89/100
            - generic [ref=e210]:
              - generic [ref=e211]: حالة العقار والتسليم
              - strong [ref=e212]: جاهزة للاستلام
        - generic [ref=e215]:
          - generic [ref=e216]:
            - generic [ref=e217]:
              - paragraph [ref=e218]: المطلوب كاش الآن
              - paragraph [ref=e219]:
                - generic [ref=e220]: 32,000
                - generic [ref=e221]: $
              - paragraph [ref=e222]: نفس المبلغ المدفوع فعلياً من مالك الوحدة — بدون أي أوفر
            - button "تقديم عرض شراء" [ref=e223]
          - generic [ref=e228]:
            - paragraph [ref=e229]: ↓ قابل للتفاوض
            - paragraph [ref=e230]: البائع مستعد للتفاوض في حدود 6% من المدفوع (حوالي 2,000 $) لسرعة التنفيذ.
          - generic [ref=e231]:
            - paragraph [ref=e232]:
              - text: "مكسبك عن سعر السوق الحالي:"
              - generic [ref=e233]: + 15,812
              - text: $
            - paragraph [ref=e234]: "سعر السوق اليوم: 112,000 $ · بعد خصم عمولتنا 1.25%"
          - paragraph [ref=e235]: سعر السوق تقدير من مالك الوحدة وعلى مسؤوليته — وليس تقييماً رسمياً من المنصة.
        - generic [ref=e237]:
          - generic [ref=e238]:
            - generic [ref=e239]: المتبقي للمطور (يُستكمل أقساطاً)
            - strong [ref=e240]: 63,000 $
          - generic [ref=e241]:
            - generic [ref=e242]: القسط الدوري
            - strong [ref=e243]: 1,050 $ · شهري
          - generic [ref=e244]:
            - generic [ref=e245]: المتبقي على الأقساط
            - strong [ref=e246]: 60 شهر
          - generic [ref=e247]:
            - generic [ref=e248]: موعد الاستلام
            - strong [ref=e249]: جاهزة للاستلام
          - generic [ref=e250]:
            - generic [ref=e251]:
              - generic [ref=e252]: عمولة المنصة على المشتري (1.25% من إجمالي العقد)
              - strong [ref=e253]: 1,188 $
            - paragraph [ref=e254]: تُدفع فقط عند إتمام نقل الملكية رسمياً — ومجاناً تماماً للبائع (0%)
          - generic [ref=e255]:
            - generic [ref=e256]: إجمالي المطلوب منك الآن
            - strong [ref=e257]: 33,188 $
        - generic [ref=e258]:
          - heading "تقييم الحي وسهولة التنقل" [level=3] [ref=e259]
          - paragraph [ref=e260]: منطقة مخدومة بالكامل وقابلة للمشي (62 مرفق وخدمة مسجلة حول الموقع)
          - generic [ref=e261]:
            - generic [ref=e263]:
              - generic [ref=e264]: مؤشر المشي والخدمات اليومية (قرب الأسواق والصيدليات والمدارس مشياً)
              - strong [ref=e269]: 88/100
            - generic [ref=e273]:
              - generic [ref=e274]: مؤشر المواصلات والربط المروري (قرب محطات الحافلات والمترو)
              - strong [ref=e283]: 92/100
        - generic [ref=e286]:
          - generic [ref=e287]:
            - generic [ref=e288]:
              - heading "الموقع والخريطة ثلاثية الأبعاد" [level=3] [ref=e289]
              - generic [ref=e290]:
                - generic [ref=e291]: 📍 تبليسي — سابورتالو (Saburtalo)
                - generic [ref=e292]: موقع موثق في السجل الجغرافي
            - generic [ref=e293]:
              - generic [ref=e294]:
                - generic [ref=e295]: 8° معتدل
                - generic [ref=e302]: AQI 34 جودة الهواء
              - button "طي القسم" [ref=e306]
          - generic [ref=e309]:
            - region "Map" [ref=e311]
            - generic [ref=e312]:
              - button [ref=e313]
              - button [ref=e315]
              - button "3D" [ref=e317]
              - button [ref=e318]
            - generic:
              - generic [ref=e322]:
                - paragraph [ref=e323]: تبليسي — سابورتالو (Saburtalo)
                - paragraph [ref=e324]: 41.7271, 44.7535
              - generic [ref=e325]:
                - link "الاتجاهات" [ref=e326] [cursor=pointer]:
                  - /url: https://www.google.com/maps/search/?api=1&query=41.7271,44.7535
                - button "عرض ثلاثي الأبعاد 3D" [ref=e330]
          - generic [ref=e337]:
            - heading "الأماكن والخدمات القريبة" [level=4] [ref=e338]
            - paragraph [ref=e339]: الأقرب أولاً · زمن المشي التقريبي · بيانات خرائط جورجيا
            - generic [ref=e340]:
              - button "الكل 62" [ref=e341]:
                - generic [ref=e342]: الكل
                - generic [ref=e343]: "62"
              - button "مدارس 4" [ref=e344]:
                - generic [ref=e348]: مدارس
                - generic [ref=e349]: "4"
              - button "حضانات ورياض أطفال 1" [ref=e350]:
                - generic [ref=e354]: حضانات ورياض أطفال
                - generic [ref=e355]: "1"
              - button "صيدليات 10" [ref=e356]:
                - generic [ref=e360]: صيدليات
                - generic [ref=e361]: "10"
              - button "سوبرماركت وأسواق 11" [ref=e362]:
                - generic [ref=e368]: سوبرماركت وأسواق
                - generic [ref=e369]: "11"
              - button "مطاعم وكافيهات 19" [ref=e370]:
                - generic [ref=e374]: مطاعم وكافيهات
                - generic [ref=e375]: "19"
              - button "عيادات ومراكز طبية 3" [ref=e376]:
                - generic [ref=e380]: عيادات ومراكز طبية
                - generic [ref=e381]: "3"
              - button "جامعات وكليات 3" [ref=e382]:
                - generic [ref=e385]: جامعات وكليات
                - generic [ref=e386]: "3"
              - button "صالات رياضية 1" [ref=e387]:
                - generic [ref=e394]: صالات رياضية
                - generic [ref=e395]: "1"
              - button "محطات حافلات ومواصلات 10" [ref=e396]:
                - generic [ref=e401]: محطات حافلات ومواصلات
                - generic [ref=e402]: "10"
            - generic [ref=e403]:
              - generic [ref=e404]:
                - generic [ref=e405]:
                  - generic [ref=e406]:
                    - generic [ref=e407]: مدارس
                    - generic [ref=e412]: "4"
                  - generic [ref=e413]:
                    - generic [ref=e414]:
                      - generic [ref=e415]:
                        - strong [ref=e416]: N°221 Sajaro Skola
                        - generic [ref=e417]: 784 m
                      - paragraph [ref=e418]: مشياً ~12 د
                    - generic [ref=e419]:
                      - generic [ref=e420]:
                        - strong [ref=e421]: Kartul-Germanuli Skola "Skhivi"
                        - generic [ref=e422]: 845 m
                      - paragraph [ref=e423]: مشياً ~13 د · مواصلات ~6 د
                    - generic [ref=e424]:
                      - generic [ref=e425]:
                        - strong [ref=e426]: QSI International School of Tbilisi
                        - generic [ref=e427]: 1.2 km
                      - paragraph [ref=e428]: مشياً ~18 د · مواصلات ~8 د
                - button "+1 المزيد ⌄" [ref=e429]
              - generic [ref=e431]:
                - generic [ref=e432]:
                  - generic [ref=e433]: حضانات ورياض أطفال
                  - generic [ref=e438]: "1"
                - generic [ref=e440]:
                  - generic [ref=e441]:
                    - strong [ref=e442]: "Kindergarten #208"
                    - generic [ref=e443]: 118 m
                  - paragraph [ref=e444]: مشياً ~2 د
              - generic [ref=e445]:
                - generic [ref=e446]:
                  - generic [ref=e447]:
                    - generic [ref=e448]: صيدليات
                    - generic [ref=e453]: "10"
                  - generic [ref=e454]:
                    - generic [ref=e455]:
                      - generic [ref=e456]:
                        - strong [ref=e457]: Jazu
                        - generic [ref=e458]: 473 m
                      - paragraph [ref=e459]: مشياً ~7 د
                    - generic [ref=e460]:
                      - generic [ref=e461]:
                        - strong [ref=e462]: Neoparmi
                        - generic [ref=e463]: 511 m
                      - paragraph [ref=e464]: مشياً ~8 د
                    - generic [ref=e465]:
                      - generic [ref=e466]:
                        - strong [ref=e467]: 36.6 Pharmacy
                        - generic [ref=e468]: 554 m
                      - paragraph [ref=e469]: مشياً ~8 د
                - button "+7 المزيد ⌄" [ref=e470]
              - generic [ref=e471]:
                - generic [ref=e472]:
                  - generic [ref=e473]:
                    - generic [ref=e474]: سوبرماركت وأسواق
                    - generic [ref=e481]: "11"
                  - generic [ref=e482]:
                    - generic [ref=e483]:
                      - generic [ref=e484]:
                        - strong [ref=e485]: Magniti Maksi
                        - generic [ref=e486]: 407 m
                      - paragraph [ref=e487]: مشياً ~6 د
                    - generic [ref=e488]:
                      - generic [ref=e489]:
                        - strong [ref=e490]: Sakura
                        - generic [ref=e491]: 437 m
                      - paragraph [ref=e492]: مشياً ~7 د
                    - generic [ref=e493]:
                      - generic [ref=e494]:
                        - strong [ref=e495]: Nikora Supermarket
                        - generic [ref=e496]: 565 m
                      - paragraph [ref=e497]: مشياً ~9 د
                - button "+8 المزيد ⌄" [ref=e498]
              - generic [ref=e499]:
                - generic [ref=e500]:
                  - generic [ref=e501]:
                    - generic [ref=e502]: مطاعم وكافيهات
                    - generic [ref=e507]: "19"
                  - generic [ref=e508]:
                    - generic [ref=e509]:
                      - generic [ref=e510]:
                        - strong [ref=e511]: Pipes
                        - generic [ref=e512]: 193 m
                      - paragraph [ref=e513]: مشياً ~3 د
                    - generic [ref=e514]:
                      - generic [ref=e515]:
                        - strong [ref=e516]: Mals Shaurma
                        - generic [ref=e517]: 392 m
                      - paragraph [ref=e518]: مشياً ~6 د
                    - generic [ref=e519]:
                      - generic [ref=e520]:
                        - strong [ref=e521]: Barakoni Georgian Restaurant
                        - generic [ref=e522]: 419 m
                      - paragraph [ref=e523]: مشياً ~6 د
                - button "+16 المزيد ⌄" [ref=e524]
              - generic [ref=e526]:
                - generic [ref=e527]:
                  - generic [ref=e528]: عيادات ومراكز طبية
                  - generic [ref=e533]: "3"
                - generic [ref=e534]:
                  - generic [ref=e535]:
                    - generic [ref=e536]:
                      - strong [ref=e537]: Vivamedi Medical Center
                      - generic [ref=e538]: 646 m
                    - paragraph [ref=e539]: مشياً ~10 د
                  - generic [ref=e540]:
                    - generic [ref=e541]:
                      - strong [ref=e542]: Evex Polyclinic
                      - generic [ref=e543]: 1.4 km
                    - paragraph [ref=e544]: مشياً ~22 د · مواصلات ~10 د · سيارة ~6 د
                  - generic [ref=e545]:
                    - generic [ref=e546]:
                      - strong [ref=e547]: Tsm. Mikael Mtavarangelozis Clinic
                      - generic [ref=e548]: 1.7 km
                    - paragraph [ref=e549]: مشياً ~26 د · مواصلات ~11 د · سيارة ~7 د
              - generic [ref=e551]:
                - generic [ref=e552]:
                  - generic [ref=e553]: جامعات وكليات
                  - generic [ref=e557]: "3"
                - generic [ref=e558]:
                  - generic [ref=e559]:
                    - generic [ref=e560]:
                      - strong [ref=e561]: Tavisupali Da Agraruli Universiteti
                      - generic [ref=e562]: 1.0 km
                    - paragraph [ref=e563]: مشياً ~15 د · مواصلات ~7 د
                  - generic [ref=e564]:
                    - generic [ref=e565]:
                      - strong [ref=e566]: Kartul-Amerikuli Universiteti (GAU)
                      - generic [ref=e567]: 1.6 km
                    - paragraph [ref=e568]: مشياً ~24 د · مواصلات ~11 د · سيارة ~6 د
                  - generic [ref=e569]:
                    - generic [ref=e570]:
                      - strong [ref=e571]: Evropis Universiteti
                      - generic [ref=e572]: 1.8 km
                    - paragraph [ref=e573]: مشياً ~27 د · مواصلات ~12 د · سيارة ~7 د
              - generic [ref=e575]:
                - generic [ref=e576]:
                  - generic [ref=e577]: صالات رياضية
                  - generic [ref=e585]: "1"
                - generic [ref=e587]:
                  - generic [ref=e588]:
                    - strong [ref=e589]: Format Fit Gym
                    - generic [ref=e590]: 607 m
                  - paragraph [ref=e591]: مشياً ~9 د
              - generic [ref=e592]:
                - generic [ref=e593]:
                  - generic [ref=e594]:
                    - generic [ref=e595]: محطات حافلات ومواصلات
                    - generic [ref=e601]: "10"
                  - generic [ref=e602]:
                    - generic [ref=e603]:
                      - generic [ref=e604]:
                        - strong [ref=e605]: "#208-E Sabavshvo Baghi Stop"
                        - generic [ref=e606]: 57 m
                      - paragraph [ref=e607]: مشياً ~1 د
                    - generic [ref=e608]:
                      - generic [ref=e609]:
                        - strong [ref=e610]: Medical University
                        - generic [ref=e611]: 91 m
                      - paragraph [ref=e612]: مشياً ~1 د
                    - generic [ref=e613]:
                      - generic [ref=e614]:
                        - strong [ref=e615]: "Grigol Peradze St. #6 Stop"
                        - generic [ref=e616]: 98 m
                      - paragraph [ref=e617]: مشياً ~1 د
                - button "+7 المزيد ⌄" [ref=e618]
        - generic [ref=e619]:
          - generic [ref=e620]:
            - generic [ref=e629]:
              - heading "حركة الشمس والإضاءة الطبيعية" [level=3] [ref=e630]
              - paragraph [ref=e631]: مسار الشمس الفلكي المحسوب من إحداثيات المنطقة
            - generic [ref=e632]:
              - generic [ref=e633]:
                - button "الشتاء" [ref=e634]
                - button "اليوم" [ref=e635]
                - button "الصيف" [ref=e636]
              - button "طي القسم" [ref=e638]
          - generic [ref=e641]:
            - paragraph [ref=e642]: تعرض النوافذ لأشعة الشمس المباشرة حسب الاتجاه
            - generic [ref=e643]:
              - generic [ref=e644]:
                - generic [ref=e645]:
                  - generic [ref=e646]: الشمال
                  - generic [ref=e647]: —
                - paragraph [ref=e649]: إضاءة ناعمة بدون شمس مباشرة
              - generic [ref=e650]:
                - generic [ref=e651]:
                  - generic [ref=e652]: الشرق
                  - generic [ref=e653]: 5 h 4 min
                - generic [ref=e656]:
                  - generic [ref=e657]: مشرق صباحاً
                  - generic [ref=e658]: 05:40–10:44
              - generic [ref=e659]:
                - generic [ref=e660]:
                  - generic [ref=e661]: الجنوب
                  - generic [ref=e662]: 10 h 8 min
                - generic [ref=e665]:
                  - generic [ref=e666]: مشمس جداً طوال النهار
                  - generic [ref=e667]: 05:40–15:48
              - generic [ref=e668]:
                - generic [ref=e669]:
                  - generic [ref=e670]: الغرب
                  - generic [ref=e671]: 5 h 4 min
                - generic [ref=e674]:
                  - generic [ref=e675]: مشرق عصراً
                  - generic [ref=e676]: 10:44–15:48
          - generic [ref=e677]:
            - img [ref=e678]:
              - generic [ref=e683]: E
              - generic [ref=e684]: S
              - generic [ref=e685]: W
            - slider [ref=e687] [cursor=pointer]: "50"
            - generic [ref=e688]:
              - generic [ref=e689]:
                - generic [ref=e690]: الوقت المحدد
                - strong [ref=e691]: 10:44
              - generic [ref=e692]:
                - generic [ref=e693]: زاوية الارتفاع
                - strong [ref=e694]: 1832°
              - generic [ref=e695]:
                - generic [ref=e696]: الاتجاه
                - strong [ref=e697]: الجنوب
              - generic [ref=e698]:
                - generic [ref=e699]: طول النهار
                - strong [ref=e700]: 10 h 8 min
            - generic [ref=e701]:
              - generic [ref=e702]:
                - generic [ref=e703]: الشروق
                - strong [ref=e704]: 05:40
              - generic [ref=e705]:
                - generic [ref=e706]: الظهيرة
                - strong [ref=e707]: 10:44 · 1832°
              - generic [ref=e708]:
                - generic [ref=e709]: الغروب
                - strong [ref=e710]: 15:48
        - generic [ref=e711]:
          - generic [ref=e718]:
            - paragraph [ref=e719]: يوجد 3 وحدة أخرى في تبليسي — سابورتالو (Saburtalo)
            - paragraph [ref=e720]: بأسعار كاش ومساحات متنوعة بدون أوفر
          - link "عرض الكل" [ref=e721] [cursor=pointer]:
            - /url: /opportunities
        - generic [ref=e722]:
          - generic [ref=e723]:
            - heading "فرص مميزة مشابهة" [level=2] [ref=e724]
            - generic [ref=e725]: وحدات حقيقية أخرى معروضة للتنازل بدون أوفر
          - generic [ref=e726]:
            - 'link "m2 at Hippodrome m2 at Hippodrome تبليسي — سابورتالو (Saburtalo) شقة · 2 غرف · 78 م² · استلام جاهزة للاستلام المطلوب كاش: 28,000 $ عرض التفاصيل ←" [ref=e727] [cursor=pointer]':
              - /url: /opportunities/e647d8f5-ccb9-4dce-ab74-f9b6affdf366
              - generic [ref=e728]:
                - img "m2 at Hippodrome" [ref=e730]
                - generic [ref=e731]:
                  - heading "m2 at Hippodrome" [level=3] [ref=e732]
                  - paragraph [ref=e733]: تبليسي — سابورتالو (Saburtalo)
                  - paragraph [ref=e734]: شقة · 2 غرف · 78 م² · استلام جاهزة للاستلام
                  - paragraph [ref=e735]: "المطلوب كاش: 28,000 $"
              - generic [ref=e737]:
                - generic [ref=e738]: عرض التفاصيل
                - generic [ref=e739]: ←
            - 'link "Green Budapest Saburtalo Green Budapest Saburtalo تبليسي — سابورتالو (Saburtalo) شقة · 3 غرف · 92 م² · استلام جاهزة للاستلام المطلوب كاش: 34,000 $ عرض التفاصيل ←" [ref=e740] [cursor=pointer]':
              - /url: /opportunities/da409419-3c7e-4a4a-8d34-84f979f48195
              - generic [ref=e741]:
                - img "Green Budapest Saburtalo" [ref=e743]
                - generic [ref=e744]:
                  - heading "Green Budapest Saburtalo" [level=3] [ref=e745]
                  - paragraph [ref=e746]: تبليسي — سابورتالو (Saburtalo)
                  - paragraph [ref=e747]: شقة · 3 غرف · 92 م² · استلام جاهزة للاستلام
                  - paragraph [ref=e748]: "المطلوب كاش: 34,000 $"
              - generic [ref=e750]:
                - generic [ref=e751]: عرض التفاصيل
                - generic [ref=e752]: ←
            - 'link "Tbilisi Gardens Tbilisi Gardens تبليسي — سابورتالو (Saburtalo) شقة · 3 غرف · 105 م² · استلام 2027 المطلوب كاش: 35,000 $ عرض التفاصيل ←" [ref=e753] [cursor=pointer]':
              - /url: /opportunities/b1cacb50-648b-4e6a-8bfa-8c10fb2e3cc4
              - generic [ref=e754]:
                - img "Tbilisi Gardens" [ref=e756]
                - generic [ref=e757]:
                  - heading "Tbilisi Gardens" [level=3] [ref=e758]
                  - paragraph [ref=e759]: تبليسي — سابورتالو (Saburtalo)
                  - paragraph [ref=e760]: شقة · 3 غرف · 105 م² · استلام 2027
                  - paragraph [ref=e761]: "المطلوب كاش: 35,000 $"
              - generic [ref=e763]:
                - generic [ref=e764]: عرض التفاصيل
                - generic [ref=e765]: ←
            - 'link "Axis Towers Vake Axis Towers Vake تبليسي — فاكي (Vake) شقة · 2 غرف · 80 م² · استلام جاهزة للاستلام المطلوب كاش: 31,000 $ عرض التفاصيل ←" [ref=e766] [cursor=pointer]':
              - /url: /opportunities/2d4c3319-8420-477d-9f29-ec078a20a4ac
              - generic [ref=e767]:
                - img "Axis Towers Vake" [ref=e769]
                - generic [ref=e770]:
                  - heading "Axis Towers Vake" [level=3] [ref=e771]
                  - paragraph [ref=e772]: تبليسي — فاكي (Vake)
                  - paragraph [ref=e773]: شقة · 2 غرف · 80 م² · استلام جاهزة للاستلام
                  - paragraph [ref=e774]: "المطلوب كاش: 31,000 $"
              - generic [ref=e776]:
                - generic [ref=e777]: عرض التفاصيل
                - generic [ref=e778]: ←
            - 'link "Krtsanisi Resort Residence Krtsanisi Resort Residence تبليسي — كرتسانيسي (Krtsanisi) شقة · 2 غرف · 90 م² · استلام جاهزة للاستلام المطلوب كاش: 29,000 $ عرض التفاصيل ←" [ref=e779] [cursor=pointer]':
              - /url: /opportunities/4e6e4690-a903-4fc8-bd07-4fadfe932274
              - generic [ref=e780]:
                - img "Krtsanisi Resort Residence" [ref=e782]
                - generic [ref=e783]:
                  - heading "Krtsanisi Resort Residence" [level=3] [ref=e784]
                  - paragraph [ref=e785]: تبليسي — كرتسانيسي (Krtsanisi)
                  - paragraph [ref=e786]: شقة · 2 غرف · 90 م² · استلام جاهزة للاستلام
                  - paragraph [ref=e787]: "المطلوب كاش: 29,000 $"
              - generic [ref=e789]:
                - generic [ref=e790]: عرض التفاصيل
                - generic [ref=e791]: ←
            - 'link "Orbi City Sea View Orbi City Sea View باتومي — نيو بوليفارد (New Boulevard) شقة فندقية · 1 غرف · 48 م² · استلام جاهزة للاستلام المطلوب كاش: 22,000 $ عرض التفاصيل ←" [ref=e792] [cursor=pointer]':
              - /url: /opportunities/cd3eb8ee-6daf-489e-8fc1-f0eb090e5710
              - generic [ref=e793]:
                - img "Orbi City Sea View" [ref=e795]
                - generic [ref=e796]:
                  - heading "Orbi City Sea View" [level=3] [ref=e797]
                  - paragraph [ref=e798]: باتومي — نيو بوليفارد (New Boulevard)
                  - paragraph [ref=e799]: شقة فندقية · 1 غرف · 48 م² · استلام جاهزة للاستلام
                  - paragraph [ref=e800]: "المطلوب كاش: 22,000 $"
              - generic [ref=e802]:
                - generic [ref=e803]: عرض التفاصيل
                - generic [ref=e804]: ←
        - generic [ref=e805]:
          - heading "تقديم عرض شراء" [level=2] [ref=e811]
          - paragraph [ref=e812]: سجّل عرضك الآن — سيتواصل معك مسؤول الحالة بخصوص الوحدة (U-15876) وإجراءات التنازل الرسمية في مقر المطور.
          - generic [ref=e813]:
            - generic [ref=e814]:
              - generic [ref=e815]:
                - generic [ref=e816]: "1. تحديد قيمة الكاش المعروض:"
                - generic [ref=e817]: "الكاش المطلوب للتنازل: 32,000 $"
              - generic [ref=e818]:
                - button "✓ حجز فوري بالسعر الموثق الكامل 32,000 $ (المدفوع الفعلي للمالك)" [ref=e819]:
                  - generic [ref=e820]: ✓ حجز فوري بالسعر الموثق الكامل
                  - strong [ref=e821]:
                    - text: 32,000 $
                    - generic [ref=e822]: (المدفوع الفعلي للمالك)
                - 'button "💬 تقديم عرض كاش عاجل (تفاوض محكوم) الحد الأدنى المسموح للعرض: 30,000 $" [ref=e823]':
                  - generic [ref=e824]: 💬 تقديم عرض كاش عاجل (تفاوض محكوم)
                  - generic [ref=e825]:
                    - text: "الحد الأدنى المسموح للعرض:"
                    - strong [ref=e826]: 30,000 $
              - generic [ref=e827]: "المبلغ الكاش الذي تعرض دفعه للمالك الآن ($):"
              - generic [ref=e828]:
                - textbox [ref=e829]: 32,000
                - generic: $
              - generic [ref=e830]: أولوية أولى للقبول الفوري وقفل الوحدة
            - generic [ref=e835]:
              - generic [ref=e836]:
                - generic [ref=e837]: الاسم بالكامل
                - textbox "اكتب اسمك الكامل" [ref=e838]
              - generic [ref=e839]:
                - generic [ref=e840]: رقم الموبايل / واتساب
                - generic [ref=e841]:
                  - button "🇬🇪 +995" [ref=e843]:
                    - generic [ref=e844]:
                      - generic [ref=e845]: 🇬🇪
                      - generic [ref=e846]: "+995"
                  - textbox "5xx xx xx xx" [ref=e849]
            - generic [ref=e850]:
              - generic [ref=e851]:
                - generic [ref=e852]: 2. جاهزية المشتري للتنفيذ
                - generic [ref=e853]:
                  - button "كاش جاهز خلال 48 ساعة" [ref=e854]
                  - button "خلال أسبوع" [ref=e855]
                  - button "خلال أسبوعين" [ref=e856]
              - generic [ref=e857]:
                - generic [ref=e858]: 3. طريقة السداد في مقر المطور
                - generic [ref=e859]:
                  - button "شيك مصرفي مقبول الدفع" [ref=e860]
                  - button "تحويل بنكي فوري" [ref=e861]
            - generic [ref=e862]:
              - generic [ref=e863]: هل لديك أي ملاحظات أو استفسارات حول الوحدة؟
              - textbox "اختياري..." [ref=e864]
            - generic [ref=e865] [cursor=pointer]:
              - checkbox "أوافق على عمولة المنصة للمشتري (1.25% من إجمالي سعر التعاقد) وتُدفع عند إتمام التنازل فقط." [ref=e866]
              - generic [ref=e867]: أوافق على عمولة المنصة للمشتري (1.25% من إجمالي سعر التعاقد) وتُدفع عند إتمام التنازل فقط.
            - generic "Cloudflare Turnstile" [ref=e869]:
              - generic [ref=e870]: تم التحقق بنجاح!
              - generic [ref=e875]:
                - generic [ref=e876]: CLOUDFLARE
                - generic [ref=e881]:
                  - link "الخصوصية" [ref=e882] [cursor=pointer]:
                    - /url: /privacy
                  - generic [ref=e883]: •
                  - link "الشروط" [ref=e884] [cursor=pointer]:
                    - /url: /terms
            - button "إرسال العرض الرسمي للمالك" [ref=e885]
            - paragraph [ref=e887]: بياناتك محمية بالكامل — لا نشاركها مع أي طرف خارجي.
  - contentinfo [ref=e888]:
    - generic [ref=e889]:
      - generic [ref=e890]:
        - generic [ref=e891]:
          - link "Aqar Exit" [ref=e892] [cursor=pointer]:
            - /url: /
          - paragraph [ref=e905]: منصة التنازل عن وحدات التقسيط بدون أوفر — البايع يسترجع فلوسه كاش، والمشتري ياخد سعر التعاقد القديم، وإحنا بنسهّل الإجراءات خطوة بخطوة
          - generic [ref=e906]:
            - link "+201098865314" [ref=e907] [cursor=pointer]:
              - /url: tel:+201098865314
            - link "واتساب" [ref=e908] [cursor=pointer]:
              - /url: https://wa.me/201098865314
            - link "info@aqarexit.com" [ref=e909] [cursor=pointer]:
              - /url: mailto:info@aqarexit.com
        - generic [ref=e910]:
          - heading "المنصة" [level=3] [ref=e911]
          - list [ref=e912]:
            - listitem [ref=e913]:
              - link "الفرص المتاحة" [ref=e914] [cursor=pointer]:
                - /url: /opportunities
            - listitem [ref=e915]:
              - link "للبايعين (بيع وحدتك)" [ref=e916] [cursor=pointer]:
                - /url: /sell
            - listitem [ref=e917]:
              - link "للمشترين (اطلب وحدة)" [ref=e918] [cursor=pointer]:
                - /url: /buy
            - listitem [ref=e919]:
              - link "حاسبة الخروج" [ref=e920] [cursor=pointer]:
                - /url: /calculator
            - listitem [ref=e921]:
              - link "المفضلة" [ref=e922] [cursor=pointer]:
                - /url: /account/favorites
            - listitem [ref=e923]:
              - link "دخول" [ref=e924] [cursor=pointer]:
                - /url: /login
        - generic [ref=e925]:
          - heading "الشركة" [level=3] [ref=e926]
          - list [ref=e927]:
            - listitem [ref=e928]:
              - link "قصتنا" [ref=e929] [cursor=pointer]:
                - /url: /story
            - listitem [ref=e930]:
              - link "إزاي بنشتغل" [ref=e931] [cursor=pointer]:
                - /url: /how-it-works
            - listitem [ref=e932]:
              - link "التقارير والمؤشرات" [ref=e933] [cursor=pointer]:
                - /url: /reports
            - listitem [ref=e934]:
              - link "الأسئلة الشائعة" [ref=e935] [cursor=pointer]:
                - /url: /faq
            - listitem [ref=e936]:
              - link "كلمنا" [ref=e937] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e938]:
          - heading "قانوني" [level=3] [ref=e939]
          - list [ref=e940]:
            - listitem [ref=e941]:
              - link "سياسة الخصوصية" [ref=e942] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e943]:
              - link "الشروط والأحكام" [ref=e944] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e945]:
              - link "لوحة الإدارة" [ref=e946] [cursor=pointer]:
                - /url: /admin
      - generic [ref=e947]:
        - generic [ref=e948]:
          - generic [ref=e949]: أسواق العمل
          - generic [ref=e950]:
            - generic [ref=e951]: جورجيا
            - generic [ref=e958]:
              - generic [ref=e964]: مصر
              - generic [ref=e965]: قريباً
            - generic [ref=e966]:
              - generic [ref=e972]: الإمارات
              - generic [ref=e973]: قريباً
            - generic [ref=e974]:
              - generic [ref=e979]: روسيا
              - generic [ref=e980]: قريباً
        - paragraph [ref=e981]: الأرقام والتقديرات المعروضة على المنصة استرشادية وتعتمد على بنود كل عقد على حدة، ولا تعتبر استشارة قانونية أو وعدًا بنتيجة محددة. المراجعة النهائية بتتم على عقدك الفعلي مع فريقنا ومستشارين قانونيين مؤهلين.
  - region "Notifications alt+T"
  - generic [ref=e986] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e987]
    - generic [ref=e991]:
      - button "Open issues overlay" [ref=e992]:
        - generic [ref=e993]:
          - generic [aria-hidden] [ref=e994]: "0"
          - generic [ref=e995]: "1"
        - generic [ref=e996]: Insight
      - button "Collapse issues badge" [ref=e997]
  - alert [ref=e1000]
```

# Test source

```ts
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
> 109 |     await page.waitForLoadState('networkidle')
      |                ^ Error: page.waitForLoadState: Test timeout of 60000ms exceeded.
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