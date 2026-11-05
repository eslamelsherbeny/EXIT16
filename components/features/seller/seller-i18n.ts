import type { Dictionary, LocaleCode } from '@/lib/i18n'

export const ACTIVE_PLATFORM_COUNTRY = 'GE'
export const DEFAULT_PHONE_CODE = '995'

export type SellerDocKey = 'contract' | 'receipts' | 'statement' | 'passport'

export type UploadedDocEntry = {
  url: string
  name: string
  uploaded_at: string
  status?: string
}

export type SellerExtraLabels = {
  georgiaLocationLabel: string
  deliveryMonthsLabel: string
  deliveryMonthsHelper: string
  contractMonthYearLabel: string
  remainingMonthsLabel: string
  remainingMonthsHelper: string
  monthsUnit: string
  docsStepTitle: string
  docsConditionTitle: string
  docsConditionDesc: string
  continueUploadLaterBtn: string
  continueToReviewBtn: string
  changeFileBtn: string
  removeFileBtn: string
  viewFullImageBtn: string
  uploadFileBtn: string
  rowContractDate: string
  rowRemainingMonths: string
  rowFeatures: string
  rowMarketPrice: string
  rowInstallment: string
  reviewNoteBeforeSubmit: string
  savedBadge: string
  verifyBoxTitle: string
  verifyBoxDescPrefix: string
  verifyBoxDescSuffix: string
  sendCodeBtn: string
  confirmCodeBtn: string
  resendCodeBtn: string
  codeSentToPrefix: string
  codeSentBody: string
  codeNotReceivedPrefix: string
  codeNotReceivedSuffix: string
  emailVerifiedBadge: string
  waVerifyBtn: string
  waVerifiedBadge: string
}

export type SellerFormTranslations = {
  pageTitle: string
  pageSubtitle: string
  exitBadge: string
  unifiedCurrencyBadge: string
  tabs: {
    type: string
    photos: string
    location: string
    details: string
    price: string
    contact: string
  }
  typeSection: {
    title: string
    subtitle: string
    whatToDoLabel: string
    whatKindLabel: string
    statusLabel: string
  }
  photosSection: {
    title: string
    subtitle: string
    dropTitle: string
    photosWord: string
    dropHint: string
    uploading: string
    coverBadge: string
    addPhotoCardLabel: string
    uploadFromPhoneLabel: string
    videoSectionTitle: string
    videoSectionSubtitle: string
    videoUrlLabel: string
    videoUrlPlaceholder: string
    tour3dLabel: string
    tour3dPlaceholder: string
  }
  locationSection: {
    title: string
    subtitleRent: string
    subtitleSale: string
    cityDistrictLabel: string
    chooseLocationPlaceholder: string
    developerLabel: string
    developerPlaceholder: string
    popularDevelopersHint: string
    projectLabel: string
    projectPlaceholder: string
    streetLabel: string
    streetPlaceholder: string
    houseNoLabel: string
    houseNoPlaceholder: string
    cadastralLabel: string
    cadastralPlaceholder: string
    cadastralHelper: string
    mapHeaderTitle: string
    mapHint: string
  }
  locationModal: {
    title: string
    searchPlaceholder: string
    searchingMapsText: string
    everywhereTitle: string
    everywhereSub: string
    nearbyTitle: string
    nearbySub: string
    detectingGpsText: string
    gpsUnsupportedError: string
    gpsPermissionError: string
    gpsSignalError: string
    popularCitiesTitle: string
    municipalitiesTitle: string
    districtsTab: string
    wholeCityBtn: string
    clearBtn: string
    selectBtn: string
  }
  detailsSection: {
    title: string
    subtitle: string
    lockedBanner: string
    conditionLabel: string
    buildingSeriesLabel: string
    buildingSeriesSub: string
    floorTypeLabel: string
    heatingLabel: string
    buildingMaterialLabel: string
    areaLabel: string
    kitchenAreaLabel: string
    yearBuiltLabel: string
    balconyAreaLabel: string
    loggiaAreaLabel: string
    terraceAreaLabel: string
    roomsLabel: string
    bedroomsLabel: string
    roomsBedroomsHint: string
    bathroomsLabel: string
    floorLabel: string
    totalFloorsLabel: string
    maxGuestsLabel: string
    featuresTitle: string
    featuresSubtitle: string
    onlineViewingTitle: string
    onlineViewingSub: string
    installmentSaleTitle: string
    installmentSaleSub: string
  }
  pricingSection: {
    title: string
    subtitle: string
    priceLabel: string
    totalPriceBtn: string
    perSqmBtn: string
    contractPriceLabel: string
    paidAmountLabel: string
    marketPriceLabel: string
    installmentAmountLabel: string
    remainingMonthsLabel: string
    contractDateLabel: string
    monthPlaceholder: string
    yearPlaceholder: string
    frequencySystemLabel: string
    freqMonthly: string
    freqQuarterly: string
    freqSemiAnnual: string
    freqAnnual: string
    deliveryYearCardLabel: string
    readyStatusCardLabel: string
    readyImmediateBadge: string
    annualInstallmentToggle: string
    annualInstallmentAmountLabel: string
    overdueInstallmentsToggle: string
    overdueCountLabel: string
    overdueTotalAmountLabel: string
    rentDailyLabel: string
    rentMonthlyLabel: string
    negotiableLabel: string
    exchangePossibleLabel: string
    discountAmountLabel: string
    districtGuideTitle: string
    districtGuideSub: string
    descriptionLabel: string
    descriptionPlaceholder: string
    docsBoxTitle: string
    docContract: string
    docReceipts: string
    docStatement: string
    docPassport: string
    changeBtn: string
    uploadBtn: string
  }
  contactSection: {
    title: string
    subtitleExit: string
    subtitleRent: string
    namePlaceholder: string
    messengersLabel: string
    confirmPasswordLabel: string
    accountOptionsTitle: string
    createAccountLinkBtn: string
    signInSyncPhoneBtn: string
    signInAnotherAccountBtn: string
    backToCurrentAccountBtn: string
    accountLinkedSuccessMsg: string
    loggedInSyncedSuccessMsg: string
    termsAgreementSuffix: string
    signInToSaveDraftError: string
    completeAccountToPublishError: string
    authFailedError: string
    validation: {
      bedroomsExceedRooms: string
      floorExceedsTotalFloors: string
      paidExceedsContract: string
      installmentRequiredForMonths: string
    }
  }
  previewSidebar: {
    title: string
    subtitle: string
    emptyPhotoTitle: string
    emptyPhotoSub: string
    priceOnRequest: string
    perDay: string
    perMonth: string
    cashRequiredSuffix: string
    bedsShort: string
    strengthTitle: string
    strengthGreat: string
    strengthGood: string
    tipPhotos: string
    tipLocation: string
    tipDetails: string
    tipDescription: string
  }
  reviewSection: {
    fastTrackPhoneTitle: string
    promoSubDesc: string
    payAndActivatePrefix: string
    payAndActivateMiddle: string
    daySingular: string
    daysPlural: string
    boostRecordedPrefix: string
    boostRecordedSuffix: string
    previewPropertyBtn: string
    pkgStarter: string
    pkgRecommended: string
    pkgTwoDays: string
    pkgPopular: string
    pkgPro: string
  }
  bottomBar: {
    savedAtPrefix: string
    autoSavedPrefix: string
    saveDraftBtn: string
    publishingBtn: string
    publishBtn: string
  }
}

const SELLER_FORM_TRANSLATIONS: Record<LocaleCode, SellerFormTranslations> = {
  ar: {
    pageTitle: 'اعرض وحدتك للتنازل واستكمال الأقساط',
    pageSubtitle:
      'استرد مدفوعاتك بالكامل بالدولار ($) — عمولة البيع 0% على البائع.',
    exitBadge: 'نظام التنازل والأقساط',
    unifiedCurrencyBadge: 'العملة الموحدة: دولار أمريكي ($)',
    tabs: {
      type: '1 نوع العقار',
      photos: '2 الصور والروابط',
      location: '3 الموقع والمطور',
      details: '4 المواصفات',
      price: '5 السعر والأقساط',
      contact: '6 حساب المالك',
    },
    typeSection: {
      title: 'نوع العقار وحالة البناء',
      subtitle: 'اختر نوع العقار المراد التنازل عنه ثم حالة البناء الحالية.',
      whatToDoLabel: 'نوع العملية',
      whatKindLabel: 'ما هو نوع العقار؟ *',
      statusLabel: 'حالة البناء والاستلام *',
    },
    photosSection: {
      title: 'الصور وروابط الفيديو والجولة الافتراضية',
      subtitle:
        'أظهر التصميم الداخلي والخارجي: غرفة المعيشة، غرف النوم، الحمامات، الشرفة، والإطلالة.',
      dropTitle: 'أضف الصور أو اسحبها هنا',
      photosWord: 'صورة',
      dropHint:
        'الإعلانات المدعومة بصور واضحة تحصل على عروض أسرع. الصورة الأولى تصبح صورة الغلاف.',
      uploading: 'جاري رفع الصور...',
      coverBadge: 'صورة الغلاف',
      addPhotoCardLabel: 'إضافة صورة',
      uploadFromPhoneLabel: 'رفع الصور من الموبايل',
      videoSectionTitle: 'روابط الفيديو والجولة ثلاثية الأبعاد (اختياري)',
      videoSectionSubtitle:
        'ضع رابط فيديو العقار من يوتيوب أو فيميو أو رابط الجولة الافتراضية 3D ليظهر في صفحة تفاصيل الوحدة.',
      videoUrlLabel: 'رابط فيديو يوتيوب / فيميو (YouTube / Vimeo)',
      videoUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      tour3dLabel: 'رابط جولة ثلاثية الأبعاد (3D Tour)',
      tour3dPlaceholder: 'https://my.matterport.com/...',
    },
    locationSection: {
      title: 'الموقع والعنوان والمطور العقاري',
      subtitleRent:
        'أدخل اسم الشارع ورقم المبنى — يظهر الدبوس على الخريطة تلقائياً.',
      subtitleSale:
        'اختر المدينة والحي وحدد اسم المطور العقاري والمشروع واسم الشارع ورقم المبنى بدقة.',
      cityDistrictLabel: 'المدينة / الحي *',
      chooseLocationPlaceholder: 'اختر الموقع',
      developerLabel: 'اسم المطور العقاري',
      developerPlaceholder: 'مثال: ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'اختيار سريع لأشهر المطورين في جورجيا:',
      projectLabel: 'اسم المشروع أو المجمع السكني *',
      projectPlaceholder: 'مثال: Orbi City, King David, White Sails...',
      streetLabel: 'اسم الشارع *',
      streetPlaceholder: 'مثال: Chavchavadze Ave / Khimshiashvili St',
      houseNoLabel: 'رقم المبنى / العمارة',
      houseNoPlaceholder: '47',
      cadastralLabel: 'الرقم العقاري الحكومي (Cadastral Code)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper:
        'اختياري — يربط الوحدة بالسجل العقاري الجورجي الرسمي NAPR',
      mapHeaderTitle: 'خريطة الموقع ثلاثية الأبعاد',
      mapHint: 'يتحرك الدبوس تلقائياً حسب الحي والشارع المختار',
    },
    locationModal: {
      title: 'اختر المدينة والحي في جورجيا',
      searchPlaceholder: 'ابحث عن الحي، المدينة، المنطقة أو الشارع...',
      searchingMapsText: 'جاري البحث في خرائط جورجيا...',
      everywhereTitle: 'في كل مكان',
      everywhereSub: 'كل المناطق في جورجيا',
      nearbyTitle: 'بالقرب مني (GPS)',
      nearbySub: 'تحديد موقعك الحالي تلقائياً',
      detectingGpsText: 'جاري تحديد موقعك...',
      gpsUnsupportedError: 'متصفحك لا يدعم خاصية تحديد الموقع GPS',
      gpsPermissionError: 'يرجى السماح للمتصفح بالوصول إلى موقعك',
      gpsSignalError: 'تعذر التقاط إشارة GPS',
      popularCitiesTitle: 'المدن الأكثر طلباً',
      municipalitiesTitle: 'البلديات والمحافظات',
      districtsTab: 'الأحياء والشوارع',
      wholeCityBtn: 'المدينة بالكامل',
      clearBtn: 'مسح',
      selectBtn: 'تأكيد الاختيار',
    },
    detailsSection: {
      title: 'المواصفات والمميزات',
      subtitle:
        'أدخل المساحة وإجمالي الغرف وغرف النوم والطابق والمميزات المتوفرة بدقة.',
      lockedBanner: 'يرجى اختيار نوع العقار بالأعلى أولاً لفتح حقول المواصفات.',
      conditionLabel: 'حالة التشطيب',
      buildingSeriesLabel: 'طراز المبنى',
      buildingSeriesSub: 'يساعد المشترين على الفلترة السريعة',
      floorTypeLabel: 'نوع الطابق',
      heatingLabel: 'نظام التدفئة',
      buildingMaterialLabel: 'مادة البناء',
      areaLabel: 'المساحة الإجمالية (م²) *',
      kitchenAreaLabel: 'مساحة المطبخ (م²)',
      yearBuiltLabel: 'سنة البناء / التسليم',
      balconyAreaLabel: 'مساحة الشرفة (م²)',
      loggiaAreaLabel: 'مساحة اللوجيا (م²)',
      terraceAreaLabel: 'مساحة التراس / الحديقة (م²)',
      roomsLabel: 'إجمالي عدد الغرف (شامل المعيشة) *',
      bedroomsLabel: 'عدد غرف النوم من إجمالي الغرف *',
      roomsBedroomsHint: 'ملاحظة: عدد غرف النوم لا يمكن أن يتخطى إجمالي الغرف.',
      bathroomsLabel: 'عدد الحمامات',
      floorLabel: 'الطابق',
      totalFloorsLabel: 'إجمالي طوابق المبنى',
      maxGuestsLabel: 'أقصى عدد للضيوف',
      featuresTitle: 'المميزات والتجهيزات',
      featuresSubtitle:
        'اختر المميزات المتوفرة فعلياً في العقار لتظهر في صفحة تفاصيل وحدتك.',
      onlineViewingTitle: 'أنا مستعد للمعاينة أونلاين بالفيديو',
      onlineViewingSub:
        'فعّل هذا الخيار إذا كان بإمكانك عرض العقار للمشتري عن بُعد عبر واتساب أو زووم.',
      installmentSaleTitle: 'متاح البيع بالتقسيط على دفعات',
      installmentSaleSub: 'فعّل هذا الخيار إذا كنت تقبل سداد السعر على دفعات.',
    },
    pricingSection: {
      title: 'السعر والأقساط والمستندات والوصف',
      subtitle: 'حدد تفاصيل العقد الأصلي والمبلغ المدفوع والأقساط المتبقية بدقة.',
      priceLabel: 'السعر *',
      totalPriceBtn: 'السعر الإجمالي',
      perSqmBtn: 'سعر المتر',
      contractPriceLabel: 'إجمالي سعر الوحدة في العقد ($) *',
      paidAmountLabel: 'المبلغ المدفوع حتى الآن (الكاش المطلوب $) *',
      marketPriceLabel: 'سعر السوق اليوم ($ تقديري)',
      installmentAmountLabel: 'قيمة القسط الدوري ($)',
      remainingMonthsLabel: 'عدد شهور التقسيط المتبقية (0 إذا خالصة)',
      contractDateLabel: 'تاريخ التعاقد الأصلي مع المطور',
      monthPlaceholder: 'الشهر *',
      yearPlaceholder: 'السنة *',
      frequencySystemLabel: 'دورية سداد الأقساط',
      freqMonthly: 'شهري',
      freqQuarterly: 'ربع سنوي',
      freqSemiAnnual: 'نصف سنوي',
      freqAnnual: 'سنوي',
      deliveryYearCardLabel: 'سنة استلام الوحدة المتوقعة (تظهر على الكارت) *',
      readyStatusCardLabel: 'حالة استلام الوحدة',
      readyImmediateBadge: 'جاهزة للاستلام الفوري ✓',
      annualInstallmentToggle: 'يوجد دفعة / قسط سنوي إضافي',
      annualInstallmentAmountLabel: 'قيمة الدفعة السنوية ($)',
      overdueInstallmentsToggle: 'يوجد أقساط متأخرة للمطور حالياً',
      overdueCountLabel: 'عدد الأقساط المتأخرة',
      overdueTotalAmountLabel: 'إجمالي المبلغ المتأخر ($)',
      rentDailyLabel: 'سعر الليلة الواحدة *',
      rentMonthlyLabel: 'سعر الإيجار الشهري *',
      negotiableLabel: 'المبلغ المطلوب (الكاش) قابل للتفاوض للمشتري الجاد',
      exchangePossibleLabel: 'متاح البدل بعقار آخر',
      discountAmountLabel: 'أقصى قيمة خصم مسموح بها للتفاوض ($ اختياري)',
      districtGuideTitle: 'مرشد أسعار المنطقة',
      districtGuideSub:
        'متوسط سعر المتر السكني في هذه المنطقة يتراوح بين $1,150 و $1,650 حسب التشطيب.',
      descriptionLabel: 'وصف تفصيلي للوحدة',
      descriptionPlaceholder:
        'اشرح مميزات الوحدة، الإطلالة، تفاصيل الطابق، وأبرز نقاط القوة للمشتري...',
      docsBoxTitle: 'مستندات الملكية والتنازل (اختياري الآن · يسرّع التوثيق)',
      docContract: 'عقد الشراء',
      docReceipts: 'إيصالات السداد',
      docStatement: 'كشف الحساب',
      docPassport: 'جواز السفر',
      changeBtn: 'تغيير',
      uploadBtn: 'ارفع',
    },
    contactSection: {
      title: '6. بيانات المالك وربط الحساب',
      subtitleExit:
        'الاسم ورقم الموبايل — (🔒 في البيع والتنازل يبقى رقمك مخفياً عن الجمهور ويظهر للإدارة فقط لحماية خصوصيتك).',
      subtitleRent:
        'الاسم ورقم الموبايل — سيتواصل معك المستأجرون هنا عبر تطبيقات المراسلة.',
      namePlaceholder: 'اكتب اسمك الثلاثي بالكامل',
      messengersLabel: 'تطبيقات المراسلة المتاحة على هذا الرقم',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      accountOptionsTitle: 'خيارات الحساب وربط الإعلان:',
      createAccountLinkBtn: 'تأكيد وإنشاء الحساب وربط الإعلان ✓',
      signInSyncPhoneBtn: 'تسجيل الدخول وسحب بياناتي المسجلة ✓',
      signInAnotherAccountBtn: 'تسجيل الدخول بحساب آخر',
      backToCurrentAccountBtn: '← العودة لبيانات حسابي الحالي',
      accountLinkedSuccessMsg:
        'تم إنشاء وربط حسابك بنجاح ✓ يمكنك الآن الضغط على زر نشر الإعلان بالأسفل',
      loggedInSyncedSuccessMsg:
        'تم تسجيل الدخول وسحب بياناتك المسجلة بنجاح ✓',
      termsAgreementSuffix: '— وأوافق على شروط وأحكام المنصة',
      signInToSaveDraftError:
        'يرجى تسجيل الدخول أو إنشاء حسابك في قسم التواصل أولاً لحفظ المسودة',
      completeAccountToPublishError:
        'يرجى إكمال بيانات تسجيل الحساب الجديد أو تسجيل الدخول بحسابك لربط الوحدة باسمك',
      authFailedError: 'تعذر التحقق من بيانات الحساب، يرجى المراجعة والمحاولة',
      validation: {
        bedroomsExceedRooms:
          'عدد غرف النوم لا يمكن أن يكون أكبر من إجمالي عدد الغرف',
        floorExceedsTotalFloors:
          'رقم الطابق لا يمكن أن يكون أكبر من إجمالي طوابق المبنى',
        paidExceedsContract:
          'المبلغ المدفوع لا يمكن أن يتخطى إجمالي سعر الوحدة في العقد',
        installmentRequiredForMonths:
          'يرجى إدخال قيمة القسط الدوري طالما يوجد شهور تقسيط متبقية',
      },
    },
    previewSidebar: {
      title: 'معاينة حية للإعلان',
      subtitle: 'هكذا سيظهر إعلانك أمام المشترين في السوق',
      emptyPhotoTitle: 'مطلوب صورة واحدة على الأقل',
      emptyPhotoSub: 'ارفع صور الوحدة — ستظهر معاينة إعلانك هنا مباشرة',
      priceOnRequest: 'السعر عند الإدخال',
      perDay: ' / يومياً',
      perMonth: ' / شهرياً',
      cashRequiredSuffix: ' (الكاش المطلوب)',
      bedsShort: 'غرف نوم',
      strengthTitle: 'اكتمال بيانات الوحدة',
      strengthGreat: 'إعلان ممتاز ومكتمل — جاهز لأعلى ظهور!',
      strengthGood: 'بداية جيدة — أضف المزيد من التفاصيل والصور',
      tipPhotos: 'أضف صوراً واضحة للوحدة',
      tipLocation: 'حدد الموقع الدقيق واسم الشارع',
      tipDetails: 'أكمل مواصفات ومساحة العقار',
      tipDescription: 'اكتب وصفاً كاملاً للعقار',
    },
    reviewSection: {
      fastTrackPhoneTitle:
        'لتسريع نشر إعلانك وتوثيق رقم هاتفك بعلامة التوثيق ✓:',
      promoSubDesc:
        'اختر الباقة المناسبة وادفع بالبطاقة لتظهر وحدتك في صدارة الصفحة الرئيسية والفرص المتاحة فور تفعيل الأدمن.',
      payAndActivatePrefix: 'ادفع',
      payAndActivateMiddle: 'وتفعيل باقة',
      daySingular: 'يوم',
      daysPlural: 'أيام',
      boostRecordedPrefix: 'تم تسجيل طلب تفعيل باقة',
      boostRecordedSuffix:
        'سيتم تفعيل التمييز تلقائياً فور مراجعة الأدمن للإعلان والدفع.',
      previewPropertyBtn: 'معاينة صفحة العقار',
      pkgStarter: 'بداية · يوم واحد',
      pkgRecommended: 'موصى به 🔥 · يوم واحد',
      pkgTwoDays: 'SUPER VIP · يومان',
      pkgPopular: 'شائع · 7 أيام',
      pkgPro: 'PRO -30% · 17 يوماً',
    },
    bottomBar: {
      savedAtPrefix: 'تم حفظ المسودة الساعة',
      autoSavedPrefix: 'اكتمال الأقسام',
      saveDraftBtn: 'حفظ كمسودة',
      publishingBtn: 'جاري النشر...',
      publishBtn: 'نشر الإعلان الآن',
    },
  },
  en: {
    pageTitle: 'List Your Unit for Installment Exit',
    pageSubtitle:
      'Recover 100% of your paid installments in USD ($) — 0% seller commission.',
    exitBadge: 'Installment Exit System',
    unifiedCurrencyBadge: 'Unified Currency: USD ($)',
    tabs: {
      type: '1 Property Type',
      photos: '2 Photos & Media',
      location: '3 Location',
      details: '4 Specifications',
      price: '5 Price & Terms',
      contact: '6 Owner Account',
    },
    typeSection: {
      title: 'Property Type & Building Status',
      subtitle:
        'Select the property type and current building status for your installment exit.',
      whatToDoLabel: 'Deal Type',
      whatKindLabel: 'What kind of property? *',
      statusLabel: 'Building & Handover Status *',
    },
    photosSection: {
      title: 'Photos, Video & 3D Tour Links',
      subtitle:
        'Show interior and exterior: living room, bedrooms, bathrooms, balcony, and view.',
      dropTitle: 'Add photos or drag them here',
      photosWord: 'photos',
      dropHint:
        'Listings with clear photos get faster offers. The first photo is the cover.',
      uploading: 'Uploading photos...',
      coverBadge: 'Cover photo',
      addPhotoCardLabel: 'Add photo',
      uploadFromPhoneLabel: 'Upload from phone',
      videoSectionTitle: 'Video & 3D Virtual Tour Links (Optional)',
      videoSectionSubtitle:
        'Paste a YouTube/Vimeo link or 3D virtual tour link to display on your unit details page.',
      videoUrlLabel: 'YouTube / Vimeo Video Link',
      videoUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      tour3dLabel: '3D Virtual Tour Link (Matterport)',
      tour3dPlaceholder: 'https://my.matterport.com/...',
    },
    locationSection: {
      title: 'Location, Street & Developer',
      subtitleRent:
        'Enter the exact street and house number — the pin drops on the map automatically.',
      subtitleSale:
        'Select the city & district, and enter the developer name, project, street, and building number.',
      cityDistrictLabel: 'City / District *',
      chooseLocationPlaceholder: 'Choose location',
      developerLabel: 'Developer Name',
      developerPlaceholder: 'e.g. ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'Quick-select popular developers in Georgia:',
      projectLabel: 'Project / Complex Name *',
      projectPlaceholder: 'e.g. Orbi City, King David, White Sails...',
      streetLabel: 'Street Name *',
      streetPlaceholder: 'e.g. Chavchavadze Ave / Khimshiashvili St',
      houseNoLabel: 'Building / House Nº',
      houseNoPlaceholder: '47',
      cadastralLabel: 'Cadastral Code (NAPR)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper: 'Optional — links unit to Georgian Public Registry NAPR',
      mapHeaderTitle: 'Interactive 3D Map',
      mapHint: 'Pin updates automatically based on selected district & street',
    },
    locationModal: {
      title: 'Select City & District in Georgia',
      searchPlaceholder: 'District, city, neighborhood or street...',
      searchingMapsText: 'Searching Georgia maps...',
      everywhereTitle: 'Everywhere',
      everywhereSub: 'All regions in Georgia',
      nearbyTitle: 'Nearby (GPS)',
      nearbySub: 'Detect from current location',
      detectingGpsText: 'Detecting location...',
      gpsUnsupportedError: 'Geolocation is not supported by your browser',
      gpsPermissionError: 'Please allow location permission in your browser',
      gpsSignalError: 'Could not detect GPS location',
      popularCitiesTitle: 'POPULAR CITIES',
      municipalitiesTitle: 'MUNICIPALITIES',
      districtsTab: 'Districts & Streets',
      wholeCityBtn: 'Whole city',
      clearBtn: 'Clear',
      selectBtn: 'Confirm Selection',
    },
    detailsSection: {
      title: 'Specifications & Features',
      subtitle:
        'Fill in accurate area, total rooms, bedrooms, floor, and available features.',
      lockedBanner: 'Please select a property type above to unlock specifications.',
      conditionLabel: 'Finishing Condition',
      buildingSeriesLabel: 'Building Series',
      buildingSeriesSub: 'Helps buyers filter quickly',
      floorTypeLabel: 'Floor Type',
      heatingLabel: 'Heating System',
      buildingMaterialLabel: 'Building Material',
      areaLabel: 'Total Area (m²) *',
      kitchenAreaLabel: 'Kitchen Area (m²)',
      yearBuiltLabel: 'Year Built / Delivered',
      balconyAreaLabel: 'Balcony (m²)',
      loggiaAreaLabel: 'Loggia (m²)',
      terraceAreaLabel: 'Terrace / Garden (m²)',
      roomsLabel: 'Total Rooms (including living room) *',
      bedroomsLabel: 'Bedrooms (out of total rooms) *',
      roomsBedroomsHint: 'Note: Bedrooms cannot exceed total rooms.',
      bathroomsLabel: 'Bathrooms',
      floorLabel: 'Floor',
      totalFloorsLabel: 'Total Building Floors',
      maxGuestsLabel: 'Max Guests',
      featuresTitle: 'Features & Amenities',
      featuresSubtitle:
        'Select all features actually available in your property.',
      onlineViewingTitle: 'I am ready for online video viewings',
      onlineViewingSub:
        'Check this box if you can show the property remotely via WhatsApp or Zoom.',
      installmentSaleTitle: 'Installment sale possible',
      installmentSaleSub:
        'Check if you accept the price paid in parts over time.',
    },
    pricingSection: {
      title: 'Price, Installments, Documents & Description',
      subtitle:
        'Enter the original contract price, paid cash amount, and remaining installment details.',
      priceLabel: 'Price *',
      totalPriceBtn: 'Total price',
      perSqmBtn: 'Price per m²',
      contractPriceLabel: 'Total Contract Price ($) *',
      paidAmountLabel: 'Paid Amount So Far (Required Cash $) *',
      marketPriceLabel: 'Current Market Price ($ Est.)',
      installmentAmountLabel: 'Periodic Installment Amount ($)',
      remainingMonthsLabel: 'Remaining Installment Months (0 if fully paid)',
      contractDateLabel: 'Original Contract Date',
      monthPlaceholder: 'Month *',
      yearPlaceholder: 'Year *',
      frequencySystemLabel: 'Installment Frequency',
      freqMonthly: 'Monthly',
      freqQuarterly: 'Quarterly',
      freqSemiAnnual: 'Semi-Annual',
      freqAnnual: 'Annual',
      deliveryYearCardLabel: 'Expected Delivery Year (Shown on Card) *',
      readyStatusCardLabel: 'Handover Status',
      readyImmediateBadge: 'Ready for Immediate Handover ✓',
      annualInstallmentToggle: 'Has additional annual payment',
      annualInstallmentAmountLabel: 'Annual Payment Amount ($)',
      overdueInstallmentsToggle: 'Has overdue installments to developer',
      overdueCountLabel: 'Overdue Installments Count',
      overdueTotalAmountLabel: 'Total Overdue Amount ($)',
      rentDailyLabel: 'Daily rent price *',
      rentMonthlyLabel: 'Monthly rent price *',
      negotiableLabel: 'Required cash amount is negotiable for serious buyers',
      exchangePossibleLabel: 'Exchange possible',
      discountAmountLabel: 'Max negotiable discount amount ($ Optional)',
      districtGuideTitle: 'District Price Guide',
      districtGuideSub:
        'Average market range in this district is $1,150 – $1,650 / m².',
      descriptionLabel: 'Detailed Property Description',
      descriptionPlaceholder:
        'Describe the property layout, view, floor advantages, and key highlights...',
      docsBoxTitle: 'Ownership Documents (Optional now · Speeds up verification)',
      docContract: 'Purchase Contract',
      docReceipts: 'Payment Receipts',
      docStatement: 'Account Statement',
      docPassport: 'Passport Copy',
      changeBtn: 'Change',
      uploadBtn: 'Upload',
    },
    contactSection: {
      title: '6. Owner Details & Account Link',
      subtitleExit:
        'Name & mobile — (🔒 Kept private from the public and visible only to Admin for brokered exit deals).',
      subtitleRent:
        'Name & mobile — tenants will reach you via your selected messengers.',
      namePlaceholder: 'Enter your full name',
      messengersLabel: 'Messengers available on this phone number',
      confirmPasswordLabel: 'Confirm Password',
      accountOptionsTitle: 'Account & listing ownership options:',
      createAccountLinkBtn: 'Create Account & Link Listing ✓',
      signInSyncPhoneBtn: 'Sign In & Sync My Details ✓',
      signInAnotherAccountBtn: 'Sign in with another account',
      backToCurrentAccountBtn: '← Back to my current account',
      accountLinkedSuccessMsg:
        'Account created and linked ✓ You can now click Publish Listing below',
      loggedInSyncedSuccessMsg: 'Signed in and contact details synced ✓',
      termsAgreementSuffix: '— and I agree to the platform terms & conditions',
      signInToSaveDraftError:
        'Please sign in or register in the Contact section first to save a draft',
      completeAccountToPublishError:
        'Please complete your account registration or sign in to link this listing',
      authFailedError: 'Authentication failed, please check your credentials',
      validation: {
        bedroomsExceedRooms: 'Bedrooms cannot exceed total rooms count',
        floorExceedsTotalFloors: 'Floor number cannot exceed total building floors',
        paidExceedsContract:
          'Paid amount cannot exceed total contract price',
        installmentRequiredForMonths:
          'Please enter the installment amount when remaining months are greater than 0',
      },
    },
    previewSidebar: {
      title: 'Live Listing Preview',
      subtitle: 'This is how buyers will see your unit',
      emptyPhotoTitle: 'At least 1 photo is required',
      emptyPhotoSub: 'Upload a photo — your live preview appears here',
      priceOnRequest: 'Price on request',
      perDay: ' /day',
      perMonth: ' /month',
      cashRequiredSuffix: ' (Cash Required)',
      bedsShort: 'Beds',
      strengthTitle: 'Listing Completeness',
      strengthGreat: 'Excellent completeness — ready for maximum visibility!',
      strengthGood: 'Good start — add more photos and details',
      tipPhotos: 'Add clear property photos',
      tipLocation: 'Specify street and exact location',
      tipDetails: 'Complete property area & rooms',
      tipDescription: 'Write a detailed description',
    },
    reviewSection: {
      fastTrackPhoneTitle:
        'To fast-track listing review & verify your phone number ✓:',
      promoSubDesc:
        'Choose a boost package to feature your unit at the top of the Homepage and Opportunities upon Admin approval.',
      payAndActivatePrefix: 'Pay',
      payAndActivateMiddle: 'for',
      daySingular: 'day',
      daysPlural: 'days',
      boostRecordedPrefix: 'Boost request recorded:',
      boostRecordedSuffix:
        'It will activate automatically upon Admin review and payment confirmation.',
      previewPropertyBtn: 'Preview Property Page',
      pkgStarter: 'Starter · 1 day',
      pkgRecommended: 'Recommended 🔥 · 1 day',
      pkgTwoDays: 'SUPER VIP · 2 days',
      pkgPopular: 'Popular · 7 days',
      pkgPro: 'PRO -30% · 17 days',
    },
    bottomBar: {
      savedAtPrefix: 'Draft saved at',
      autoSavedPrefix: 'Sections completed',
      saveDraftBtn: 'Save draft',
      publishingBtn: 'Publishing...',
      publishBtn: 'Publish Listing',
    },
  },
  ru: {
    pageTitle: 'Разместить объект по переуступке рассрочки',
    pageSubtitle:
      'Верните 100% выплаченных средств в долларах ($) — комиссия для продавца 0%.',
    exitBadge: 'Переуступка рассрочки',
    unifiedCurrencyBadge: 'Единая валюта: USD ($)',
    tabs: {
      type: '1 Тип объекта',
      photos: '2 Фото и медиа',
      location: '3 Локация',
      details: '4 Характеристики',
      price: '5 Цена и условия',
      contact: '6 Аккаунт',
    },
    typeSection: {
      title: 'Тип недвижимости и статус здания',
      subtitle: 'Выберите тип объекта и текущий статус строительства.',
      whatToDoLabel: 'Тип сделки',
      whatKindLabel: 'Какой тип недвижимости? *',
      statusLabel: 'Статус строительства *',
    },
    photosSection: {
      title: 'Фотографии, видео и 3D-тур',
      subtitle:
        'Покажите интерьер и экстерьер: гостиную, спальни, санузел, балкон и вид из окон.',
      dropTitle: 'Добавьте фото или перетащите их сюда',
      photosWord: 'фото',
      dropHint: 'Первое фото станет главной обложкой объявления.',
      uploading: 'Загрузка фото...',
      coverBadge: 'Обложка',
      addPhotoCardLabel: 'Добавить фото',
      uploadFromPhoneLabel: 'Загрузить с телефона',
      videoSectionTitle: 'Ссылки на видео и 3D-тур (Необязательно)',
      videoSectionSubtitle:
        'Вставьте ссылку на YouTube / Vimeo или 3D-тур для отображения на странице объекта.',
      videoUrlLabel: 'Ссылка на видео YouTube / Vimeo',
      videoUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      tour3dLabel: 'Ссылка на 3D-тур (Matterport)',
      tour3dPlaceholder: 'https://my.matterport.com/...',
    },
    locationSection: {
      title: 'Местоположение, улица и застройщик',
      subtitleRent:
        'Укажите улицу и номер дома — пин появится на карте автоматически.',
      subtitleSale:
        'Выберите город и район, укажите застройщика, ЖК, улицу и номер дома.',
      cityDistrictLabel: 'Город / Район *',
      chooseLocationPlaceholder: 'Выберите локацию',
      developerLabel: 'Застройщик',
      developerPlaceholder: 'Напр.: ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'Быстрый выбор популярных застройщиков Грузии:',
      projectLabel: 'Название ЖК / Проекта *',
      projectPlaceholder: 'Напр.: Orbi City, King David, White Sails...',
      streetLabel: 'Улица *',
      streetPlaceholder: 'Напр.: Chavchavadze Ave / Khimshiashvili St',
      houseNoLabel: 'Номер дома',
      houseNoPlaceholder: '47',
      cadastralLabel: 'Кадастровый код (NAPR)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper: 'Необязательно — привязка к реестру недвижимости Грузии',
      mapHeaderTitle: 'Интерактивная 3D-карта',
      mapHint: 'Пин перемещается автоматически по выбранному району и улице',
    },
    locationModal: {
      title: 'Выберите город и район в Грузии',
      searchPlaceholder: 'Район, город, микрорайон или улица...',
      searchingMapsText: 'Поиск по карте Грузии...',
      everywhereTitle: 'Везде',
      everywhereSub: 'Все регионы Грузии',
      nearbyTitle: 'Рядом со мной (GPS)',
      nearbySub: 'Определить по геолокации',
      detectingGpsText: 'Определение локации...',
      gpsUnsupportedError: 'Ваш браузер не поддерживает геолокацию GPS',
      gpsPermissionError: 'Разрешите доступ к геолокации в браузере',
      gpsSignalError: 'Не удалось определить сигнал GPS',
      popularCitiesTitle: 'ПОПУЛЯРНЫЕ ГОРОДА',
      municipalitiesTitle: 'МУНИЦИПАЛИТЕТЫ',
      districtsTab: 'Районы и улицы',
      wholeCityBtn: 'Весь город',
      clearBtn: 'Сбросить',
      selectBtn: 'Выбрать',
    },
    detailsSection: {
      title: 'Характеристики и удобства',
      subtitle: 'Точно укажите площадь, общее число комнат, спальни и этаж.',
      lockedBanner: 'Выберите тип недвижимости выше, чтобы открыть поля.',
      conditionLabel: 'Состояние / Ремонт',
      buildingSeriesLabel: 'Серия дома',
      buildingSeriesSub: 'Помогает покупателям быстрее находить объект',
      floorTypeLabel: 'Тип этажа',
      heatingLabel: 'Отопление',
      buildingMaterialLabel: 'Материал здания',
      areaLabel: 'Общая площадь (м²) *',
      kitchenAreaLabel: 'Площадь кухни (м²)',
      yearBuiltLabel: 'Год постройки / сдачи',
      balconyAreaLabel: 'Балкон (м²)',
      loggiaAreaLabel: 'Лоджия (м²)',
      terraceAreaLabel: 'Терраса / Сад (м²)',
      roomsLabel: 'Всего комнат (включая гостиную) *',
      bedroomsLabel: 'Спальни (из общего числа комнат) *',
      roomsBedroomsHint: 'Примечание: число спален не может превышать общее число комнат.',
      bathroomsLabel: 'Санузлы',
      floorLabel: 'Этаж',
      totalFloorsLabel: 'Всего этажей в доме',
      maxGuestsLabel: 'Макс. гостей',
      featuresTitle: 'Удобства и оснащение',
      featuresSubtitle: 'Отметьте все удобства, которые реально есть в объекте.',
      onlineViewingTitle: 'Готов к онлайн-показу по видеосвязи',
      onlineViewingSub:
        'Отметьте, если можете показать объект удаленно через WhatsApp или Zoom.',
      installmentSaleTitle: 'Возможна продажа в рассрочку',
      installmentSaleSub: 'Отметьте, если готовы принимать оплату частями.',
    },
    pricingSection: {
      title: 'Цена, рассрочка, документы и описание',
      subtitle: 'Укажите полную цену по договору, выплаченную сумму и остаток рассрочки.',
      priceLabel: 'Цена *',
      totalPriceBtn: 'Общая цена',
      perSqmBtn: 'Цена за м²',
      contractPriceLabel: 'Полная цена по договору ($) *',
      paidAmountLabel: 'Выплачено на сегодня (Сумма на руки $) *',
      marketPriceLabel: 'Рыночная цена сегодня ($)',
      installmentAmountLabel: 'Платеж по рассрочке ($)',
      remainingMonthsLabel: 'Осталось месяцев рассрочки (0 если выплачено)',
      contractDateLabel: 'Дата первоначального договора',
      monthPlaceholder: 'Месяц *',
      yearPlaceholder: 'Год *',
      frequencySystemLabel: 'Периодичность платежей',
      freqMonthly: 'Ежемесячно',
      freqQuarterly: 'Ежеквартально',
      freqSemiAnnual: 'Раз в полгода',
      freqAnnual: 'Ежегодно',
      deliveryYearCardLabel: 'Ожидаемый год сдачи (На карточке) *',
      readyStatusCardLabel: 'Статус готовности',
      readyImmediateBadge: 'Готово к заселению ✓',
      annualInstallmentToggle: 'Есть дополнительный годовой платеж',
      annualInstallmentAmountLabel: 'Сумма годового платежа ($)',
      overdueInstallmentsToggle: 'Есть просроченные платежи застройщику',
      overdueCountLabel: 'Количество просроченных платежей',
      overdueTotalAmountLabel: 'Общая сумма просрочки ($)',
      rentDailyLabel: 'Цена за сутки *',
      rentMonthlyLabel: 'Цена в месяц *',
      negotiableLabel: 'Сумма на руки обсуждается с реальным покупателем',
      exchangePossibleLabel: 'Возможен обмен',
      discountAmountLabel: 'Макс. сумма скидки при торге ($ необязательно)',
      districtGuideTitle: 'Ориентир цен в районе',
      districtGuideSub: 'Средний диапазон цен в этом районе: $1,150 – $1,650 / м².',
      descriptionLabel: 'Подробное описание объекта',
      descriptionPlaceholder:
        'Опишите планировку, вид из окон, преимущества этажа и комплекса...',
      docsBoxTitle: 'Документы на объект (Необязательно сейчас · Ускоряет проверку)',
      docContract: 'Договор купли',
      docReceipts: 'Квитанции оплаты',
      docStatement: 'Выписка со счета',
      docPassport: 'Паспорт',
      changeBtn: 'Заменить',
      uploadBtn: 'Загрузить',
    },
    contactSection: {
      title: '6. Данные собственника и аккаунт',
      subtitleExit:
        'Имя и телефон — (🔒 Скрыты от публики и доступны только администрации для защиты сделки).',
      subtitleRent: 'Имя и телефон — для связи через выбранные мессенджеры.',
      namePlaceholder: 'Введите ваше полное имя',
      messengersLabel: 'Доступные мессенджеры на этом номере',
      confirmPasswordLabel: 'Подтвердите пароль',
      accountOptionsTitle: 'Параметры аккаунта и привязки объявления:',
      createAccountLinkBtn: 'Создать аккаунт и привязать объект ✓',
      signInSyncPhoneBtn: 'Войти и синхронизировать данные ✓',
      signInAnotherAccountBtn: 'Войти в другой аккаунт',
      backToCurrentAccountBtn: '← Вернуться к текущему аккаунту',
      accountLinkedSuccessMsg:
        'Аккаунт создан и привязан ✓ Теперь нажмите «Опубликовать» внизу',
      loggedInSyncedSuccessMsg: 'Вход выполнен, данные синхронизированы ✓',
      termsAgreementSuffix: '— и принимаю правила платформы',
      signInToSaveDraftError:
        'Войдите или зарегистрируйтесь в разделе Контакты для сохранения черновика',
      completeAccountToPublishError:
        'Заполните данные регистрации или войдите в аккаунт для публикации',
      authFailedError: 'Ошибка авторизации, проверьте введенные данные',
      validation: {
        bedroomsExceedRooms:
          'Количество спален не может превышать общее количество комнат',
        floorExceedsTotalFloors:
          'Этаж не может быть больше общей этажности здания',
        paidExceedsContract:
          'Выплаченная сумма не может превышать полную цену по договору',
        installmentRequiredForMonths:
          'Укажите сумму платежа, если остались месяцы рассрочки',
      },
    },
    previewSidebar: {
      title: 'Предпросмотр объявления',
      subtitle: 'Так покупатели увидят ваш объект',
      emptyPhotoTitle: 'Нужно хотя бы 1 фото',
      emptyPhotoSub: 'Загрузите фото — предпросмотр появится здесь',
      priceOnRequest: 'Цена по запросу',
      perDay: ' /сут.',
      perMonth: ' /мес.',
      cashRequiredSuffix: ' (На руки)',
      bedsShort: 'спальни',
      strengthTitle: 'Заполненность объявления',
      strengthGreat: 'Отличное заполнение — готово к публикации!',
      strengthGood: 'Хорошее начало — добавьте больше фото и деталей',
      tipPhotos: 'Добавьте качественные фото объекта',
      tipLocation: 'Укажите улицу и точную локацию',
      tipDetails: 'Заполните площадь и комнаты',
      tipDescription: 'Напишите подробное описание',
    },
    reviewSection: {
      fastTrackPhoneTitle:
        'Для быстрой проверки объявления и подтверждения телефона ✓:',
      promoSubDesc:
        'Выберите пакет продвижения для вывода объекта в ТОП главной страницы и каталога после одобрения.',
      payAndActivatePrefix: 'Оплатить',
      payAndActivateMiddle: 'за пакет',
      daySingular: 'день',
      daysPlural: 'дн.',
      boostRecordedPrefix: 'Запрос на продвижение сохранен:',
      boostRecordedSuffix:
        'Продвижение активируется автоматически после проверки администратором.',
      previewPropertyBtn: 'Предпросмотр страницы объекта',
      pkgStarter: 'Старт · 1 день',
      pkgRecommended: 'Рекомендуем 🔥 · 1 день',
      pkgTwoDays: 'SUPER VIP · 2 дня',
      pkgPopular: 'Популярный · 7 дней',
      pkgPro: 'PRO -30% · 17 дней',
    },
    bottomBar: {
      savedAtPrefix: 'Черновик сохранен в',
      autoSavedPrefix: 'Заполнено разделов',
      saveDraftBtn: 'Сохранить черновик',
      publishingBtn: 'Публикация...',
      publishBtn: 'Опубликовать',
    },
  },
  ka: {
    pageTitle: 'განათავსეთ ქონება განვადების გადაბარებით',
    pageSubtitle:
      'დაიბრუნეთ გადახდილი თანხის 100% დოლარში ($) — საკომისიო გამყიდველისთვის 0%.',
    exitBadge: 'განვადების გადაბარება',
    unifiedCurrencyBadge: 'ერთიანი ვალუტა: USD ($)',
    tabs: {
      type: '1 ქონების ტიპი',
      photos: '2 ფოტო და მედია',
      location: '3 მდებარეობა',
      details: '4 მახასიათებლები',
      price: '5 ფასი და პირობები',
      contact: '6 ანგარიში',
    },
    typeSection: {
      title: 'ქონების ტიპი და მშენებლობის სტატუსი',
      subtitle: 'აირჩიეთ ქონების სახეობა და მშენებლობის მიმდინარე სტატუსი.',
      whatToDoLabel: 'გარიგების ტიპი',
      whatKindLabel: 'რა ტიპის ქონებაა? *',
      statusLabel: 'მშენებლობის სტატუსი *',
    },
    photosSection: {
      title: 'ფოტოები, ვიდეო და 3D ტურის ბმულები',
      subtitle:
        'აჩვენეთ ინტერიერი და ექსტერიერი: მისაღები, საძინებელი, სველი წერტილი, აივანი და ხედი.',
      dropTitle: 'დაამატეთ ფოტოები ან გადმოიტანეთ აქ',
      photosWord: 'ფოტო',
      dropHint: 'პირველი ფოტო გახდება განცხადების მთავარი სურათი.',
      uploading: 'ფოტოები იტვირთება...',
      coverBadge: 'მთავარი ფოტო',
      addPhotoCardLabel: 'ფოტოს დამატება',
      uploadFromPhoneLabel: 'ტელეფონიდან ატვირთვა',
      videoSectionTitle: 'ვიდეო და 3D ტურის ბმულები (არასავალდებულო)',
      videoSectionSubtitle:
        'ჩასვით YouTube / Vimeo ან 3D ტურის ბმული ქონების გვერდზე გამოსაჩენად.',
      videoUrlLabel: 'YouTube / Vimeo ვიდეოს ბმული',
      videoUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      tour3dLabel: '3D ტურის ბმული (Matterport)',
      tour3dPlaceholder: 'https://my.matterport.com/...',
    },
    locationSection: {
      title: 'მდებარეობა, ქუჩა და დეველოპერი',
      subtitleRent:
        'შეიყვანეთ ქუჩა და სახლის ნომერი — პინი რუკაზე ავტომატურად გამოჩნდება.',
      subtitleSale:
        'აირჩიეთ ქალაქი და უბანი, მიუთითეთ დეველოპერი, პროექტი, ქუჩა და სახლის ნომერი.',
      cityDistrictLabel: 'ქალაქი / უბანი *',
      chooseLocationPlaceholder: 'აირჩიეთ მდებარეობა',
      developerLabel: 'დეველოპერი',
      developerPlaceholder: 'მაგ.: ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'საქართველოს პოპულარული დეველოპერები:',
      projectLabel: 'პროექტის / კომპლექსის სახელი *',
      projectPlaceholder: 'მაგ.: Orbi City, King David, White Sails...',
      streetLabel: 'ქუჩის სახელი *',
      streetPlaceholder: 'მაგ.: Chavchavadze Ave / Khimshiashvili St',
      houseNoLabel: 'სახლის / კორპუსის Nº',
      houseNoPlaceholder: '47',
      cadastralLabel: 'საკადასტრო კოდი (NAPR)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper: 'არასავალდებულო — საჯარო რეესტრის კოდი',
      mapHeaderTitle: 'ინტერაქტიული 3D რუკა',
      mapHint: 'პინი ავტომატურად მოძრაობს არჩეული უბნისა და ქუჩის მიხედვით',
    },
    locationModal: {
      title: 'აირჩიეთ ქალაქი და უბანი საქართველოში',
      searchPlaceholder: 'უბანი, ქალაქი ან ქუჩა...',
      searchingMapsText: 'ძიება საქართველოს რუკაზე...',
      everywhereTitle: 'ყველგან',
      everywhereSub: 'საქართველოს ყველა რეგიონი',
      nearbyTitle: 'ჩემთან ახლოს (GPS)',
      nearbySub: 'მდებარეობის ავტომატური განსაზღვრა',
      detectingGpsText: 'მდებარეობის განსაზღვრა...',
      gpsUnsupportedError: 'თქვენს ბრაუზერს არ აქვს GPS მხარდაჭერა',
      gpsPermissionError: 'გთხოვთ დაუშვათ მდებარეობაზე წვდომა ბრაუზერში',
      gpsSignalError: 'GPS სიგნალის მიღება ვერ მოხერხდა',
      popularCitiesTitle: 'პოპულარული ქალაქები',
      municipalitiesTitle: 'მუნიციპალიტეტები',
      districtsTab: 'უბნები და ქუჩები',
      wholeCityBtn: 'მთელი ქალაქი',
      clearBtn: 'გასუფთავება',
      selectBtn: 'არჩევა',
    },
    detailsSection: {
      title: 'მახასიათებლები და კეთილმოწყობა',
      subtitle: 'შეავსეთ ფართობი, ოთახების რაოდენობა, საძინებლები და სართული.',
      lockedBanner: 'ველების გასახსნელად ზემოთ აირჩიეთ ქონების ტიპი.',
      conditionLabel: 'მდგომარეობა / რემონტი',
      buildingSeriesLabel: 'შენობის პროექტი',
      buildingSeriesSub: 'ეხმარება მყიდველებს სწრაფ ფილტრაციაში',
      floorTypeLabel: 'სართულის ტიპი',
      heatingLabel: 'გათბობა',
      buildingMaterialLabel: 'სამშენებლო მასალა',
      areaLabel: 'საერთო ფართი (მ²) *',
      kitchenAreaLabel: 'სამზარეულოს ფართი (მ²)',
      yearBuiltLabel: 'აშენების / ჩაბარების წელი',
      balconyAreaLabel: 'აივანი (მ²)',
      loggiaAreaLabel: 'ლოჯია (მ²)',
      terraceAreaLabel: 'ტერასა / ეზო (მ²)',
      roomsLabel: 'ოთახების საერთო რაოდენობა *',
      bedroomsLabel: 'საძინებლების რაოდენობა *',
      roomsBedroomsHint: 'შენიშვნა: საძინებლების რაოდენობა არ უნდა აღემატებოდეს ოთახების რაოდენობას.',
      bathroomsLabel: 'სველი წერტილები',
      floorLabel: 'სართული',
      totalFloorsLabel: 'სართულები სულ',
      maxGuestsLabel: 'სტუმრების მაქს. რაოდენობა',
      featuresTitle: 'მახასიათებლები',
      featuresSubtitle: 'მონიშნეთ ყველა არსებული კეთილმოწყობა.',
      onlineViewingTitle: 'მზად ვარ ონლაინ ვიდეო ჩვენებისთვის',
      onlineViewingSub:
        'მონიშნეთ, თუ შეგიძლიათ ქონების დისტანციურად ჩვენება WhatsApp ან Zoom-ით.',
      installmentSaleTitle: 'შესაძლებელია შიდა განვადება',
      installmentSaleSub: 'მონიშნეთ, თუ თანახმა ხართ ნაწილ-ნაწილ გადახდაზე.',
    },
    pricingSection: {
      title: 'ფასი, განვადება, დოკუმენტები და აღწერა',
      subtitle: 'მიუთითეთ კონტრაქტის ფასი, გადახდილი თანხა და დარჩენილი განვადება.',
      priceLabel: 'ფასი *',
      totalPriceBtn: 'სრული ფასი',
      perSqmBtn: 'ფასი მ²-ზე',
      contractPriceLabel: 'კონტრაქტის სრული ფასი ($) *',
      paidAmountLabel: 'გადახდილი თანხა (საჭირო თანხა ხელზე $) *',
      marketPriceLabel: 'საბაზრო ფასი დღეს ($)',
      installmentAmountLabel: 'განვადების შენატანი ($)',
      remainingMonthsLabel: 'დარჩენილი თვეები (0 თუ სრულად გადახდილია)',
      contractDateLabel: 'კონტრაქტის გაფორმების თარიღი',
      monthPlaceholder: 'თვე *',
      yearPlaceholder: 'წელი *',
      frequencySystemLabel: 'გადახდის პერიოდულობა',
      freqMonthly: 'თვიური',
      freqQuarterly: 'კვარტალური',
      freqSemiAnnual: '6 თვეში ერთხელ',
      freqAnnual: 'წლიური',
      deliveryYearCardLabel: 'ჩაბარების წელი (ბარათზე) *',
      readyStatusCardLabel: 'ჩაბარების სტატუსი',
      readyImmediateBadge: 'მზადაა შესასვლელად ✓',
      annualInstallmentToggle: 'არის დამატებითი წლიური შენატანი',
      annualInstallmentAmountLabel: 'წლიური შენატანის ოდენობა ($)',
      overdueInstallmentsToggle: 'არის ვადაგადაცილებული შენატانები',
      overdueCountLabel: 'ვადაგადაცილებული თვეების რაოდენობა',
      overdueTotalAmountLabel: 'ვადაგადაცილებული თანხა სულ ($)',
      rentDailyLabel: 'დღიური ფასი *',
      rentMonthlyLabel: 'თვიური ქირის ფასი *',
      negotiableLabel: 'საჭირო თანხა (ხელზე) ექვემდებარება შეთანხმებას',
      exchangePossibleLabel: 'შესაძლებელია გაცვლა',
      discountAmountLabel: 'მაქსიმალური დასაშვები ფასდაკლება ($ არასავალდებულო)',
      districtGuideTitle: 'უბნის ფასების გზამკვლევი',
      districtGuideSub: 'საშუალო საბაზრო ფასი ამ უბანში: $1,150 – $1,650 / მ².',
      descriptionLabel: 'დეტალური აღწერა',
      descriptionPlaceholder:
        'აღწერეთ ქონების უპირატესობები, ხედი, სართული და კომპლექსის პირობები...',
      docsBoxTitle: 'საკუთრების დოკუმენტები (არასავალდებულო ახლა)',
      docContract: 'ნასყიდობის კონტრაქტი',
      docReceipts: 'გადახდის ქვითრები',
      docStatement: 'ამონაწერი',
      docPassport: 'პასპორტი',
      changeBtn: 'შეცვლა',
      uploadBtn: 'ატვირთვა',
    },
    contactSection: {
      title: '6. მესაკუთრის მონაცემები და ანგარიში',
      subtitleExit:
        'სახელი და ტელეფონი — (🔒 დაფარულია საჯაროდ და ჩანს მხოლოდ ადმინისტრაციისთვის).',
      subtitleRent: 'სახელი და ტელეფონი — კონტაქტისთვის მესენჯერებით.',
      namePlaceholder: 'შეიყვანეთ თქვენი სრული სახელი',
      messengersLabel: 'ამ ნომერზე ხელმისაწვდომი მესენჯერები',
      confirmPasswordLabel: 'გაიმეორეთ პაროლი',
      accountOptionsTitle: 'ანგარიშის და განცხადების პარამეტრები:',
      createAccountLinkBtn: 'ანგარიშის შექმნა და განცხადების მიბმა ✓',
      signInSyncPhoneBtn: 'შესვლა და მონაცემების სინქრონიზაცია ✓',
      signInAnotherAccountBtn: 'სხვა ანგარიშით შესვლა',
      backToCurrentAccountBtn: '← ჩემს ანგარიშზე დაბრუნება',
      accountLinkedSuccessMsg:
        'ანგარიში შეიქმნა ✓ ახლა დააჭირეთ „გამოქვეყნებას“ ქვემოთ',
      loggedInSyncedSuccessMsg: 'ავტორიზაცია წარმატებულია ✓',
      termsAgreementSuffix: '— და ვეთანხმები პლატფორმის წესებს',
      signInToSaveDraftError:
        'მონახაზის შესანახად გთხოვთ გაიაროთ ავტორიზაცია კონტაქტის სექციაში',
      completeAccountToPublishError:
        'გამოსაქვეყნებლად გთხოვთ შეავსოთ რეგისტრაციის ველები ან შეხვიდეთ ანგარიშში',
      authFailedError: 'ავტორიზაცია ვერ მოხერხდა, გადაამოწმეთ მონაცემები',
      validation: {
        bedroomsExceedRooms:
          'საძინებლების რაოდენობა არ შეიძლება აღემატებოდეს ოთახების საერთო რაოდენობას',
        floorExceedsTotalFloors:
          'სართული არ შეიძლება აღემატებოდეს შენობის სართულიანობას',
        paidExceedsContract:
          'გადახდილი თანხა არ შეიძლება აღემატებოდეს კონტრაქტის სრულ ფასს',
        installmentRequiredForMonths:
          'მიუთითეთ განვადების შენატანი, თუ დარჩენილი თვეები 0-ზე მეტია',
      },
    },
    previewSidebar: {
      title: 'ცოცხალი გადახედვა',
      subtitle: 'ასე დაინახავენ მყიდველები თქვენს განცხადებას',
      emptyPhotoTitle: 'საჭიროა მინიმუმ 1 ფოტო',
      emptyPhotoSub: 'ატვირთეთ ფოტო — გადახედვა აქ გამოჩნდება',
      priceOnRequest: 'ფასი შეთანხმებით',
      perDay: ' /დღე',
      perMonth: ' /თვე',
      cashRequiredSuffix: ' (საჭირო თანხა)',
      bedsShort: 'საძინებელი',
      strengthTitle: 'განცხადების შევსება',
      strengthGreat: 'შესანიშნავი შევსება — მზადაა გამოსაქვეყნებლად!',
      strengthGood: 'კარგი დასაწყისია — დაამატეთ ფოტოები და დეტალები',
      tipPhotos: 'დაამატეთ ქონების ფოტოები',
      tipLocation: 'მიუთითეთ ზუსტი ქუჩა და მდებარეობა',
      tipDetails: 'შეავსეთ ფართობი და ოთახები',
      tipDescription: 'დაწერეთ დეტალური აღწერა',
    },
    reviewSection: {
      fastTrackPhoneTitle:
        'განცხადების სწრაფი გამოქვეყნებისა და ნომრის დადასტურებისთვის ✓:',
      promoSubDesc:
        'აირჩიეთ VIP პაკეტი თქვენი ქონების მთავარ გვერდზე გამოსაჩენად.',
      payAndActivatePrefix: 'გადაიხადეთ',
      payAndActivateMiddle: 'პაკეტისთვის',
      daySingular: 'დღე',
      daysPlural: 'დღე',
      boostRecordedPrefix: 'მოთხოვნა მიღებულია:',
      boostRecordedSuffix:
        'პაკეტი გააქტიურდება ადმინისტრაციის მიერ შემოწმებისთანავე.',
      previewPropertyBtn: 'ქონების გვერდის ნახვა',
      pkgStarter: 'სტარტი · 1 დღე',
      pkgRecommended: 'რეკომენდებული 🔥 · 1 დღე',
      pkgTwoDays: 'SUPER VIP · 2 დღე',
      pkgPopular: 'პოპულარული · 7 დღე',
      pkgPro: 'PRO -30% · 17 დღე',
    },
    bottomBar: {
      savedAtPrefix: 'მონახაზი შენახულია',
      autoSavedPrefix: 'შევსებულია სექციები',
      saveDraftBtn: 'მონახაზის შენახვა',
      publishingBtn: 'ქვეყნდება...',
      publishBtn: 'გამოქვეყნება',
    },
  },
}

const SELLER_EXTRA_FALLBACKS: Record<LocaleCode, SellerExtraLabels> = {
  ar: {
    georgiaLocationLabel: 'المدينة / الحي في جورجيا *',
    deliveryMonthsLabel: 'متبقي كام شهر على الاستلام؟ *',
    deliveryMonthsHelper: 'اكتب عدد الشهور المتبقية حتى موعد استلام الوحدة',
    contractMonthYearLabel: 'تاريخ التعاقد (الشهر والسنة) *',
    remainingMonthsLabel: 'فاضل كام شهر تقسيط؟ *',
    remainingMonthsHelper: 'لو التقسيط خلص، اكتب صفر',
    monthsUnit: 'شهر',
    docsStepTitle: 'مستندات الملكية وجواز السفر',
    docsConditionTitle: 'رفع المستندات شرط أساسي لنشر وحدتك على المنصة',
    docsConditionDesc:
      'لضمان الجدية وحماية الملكية، يتم نشر الوحدة أمام المشترين بعد مراجعة العقد وصورة جواز السفر.',
    continueUploadLaterBtn: 'كمّل وهرفعها بعدين',
    continueToReviewBtn: 'التالي — مراجعة الطلب',
    changeFileBtn: 'تغيير',
    removeFileBtn: 'حذف',
    viewFullImageBtn: 'معاينة',
    uploadFileBtn: 'ارفع الملف',
    rowContractDate: 'تاريخ التعاقد',
    rowRemainingMonths: 'الأقساط المتبقية (بالشهور)',
    rowFeatures: 'المميزات',
    rowMarketPrice: 'سعر السوق دلوقتي',
    rowInstallment: 'القسط',
    reviewNoteBeforeSubmit: 'أول ما تبعت، فريقنا بيراجع الوحدة وينشرها في السوق.',
    savedBadge: 'محفوظ ✓',
    verifyBoxTitle: 'خطوة أخيرة — أكّد بريدك الإلكتروني',
    verifyBoxDescPrefix: 'عشان نحمي المنصة، هنبعتلك كود على إيميلك',
    verifyBoxDescSuffix: '— فجهّز إيميلك.',
    sendCodeBtn: 'ابعتلي الكود',
    confirmCodeBtn: 'تأكيد',
    resendCodeBtn: 'ابعت تاني',
    codeSentToPrefix: '✉️ الكود اتبعت على إيميلك',
    codeSentBody: 'افتح إيميلك دلوقتي. الكود مكتوب في عنوان الرسالة.',
    codeNotReceivedPrefix: 'لسه موصلش؟ كلمنا على واتساب',
    codeNotReceivedSuffix: 'وهنكمّل معاك.',
    emailVerifiedBadge: 'تم توثيق بريدك الإلكتروني بنجاح ✓',
    waVerifyBtn: 'تأكيد رقم الموبايل والوحدة عبر واتساب',
    waVerifiedBadge: 'تم تأكيد رقم الموبايل عبر واتساب ✓',
  },
  en: {
    georgiaLocationLabel: 'City / District in Georgia *',
    deliveryMonthsLabel: 'Remaining months until delivery *',
    deliveryMonthsHelper: 'Enter how many months left until handover',
    contractMonthYearLabel: 'Contract Date (Month & Year) *',
    remainingMonthsLabel: 'Remaining installment months *',
    remainingMonthsHelper: 'If fully paid, enter 0',
    monthsUnit: 'months',
    docsStepTitle: 'Ownership Documents & Passport',
    docsConditionTitle: 'Uploading documents is required to publish your unit',
    docsConditionDesc:
      'To protect both buyer and seller, units are published on the marketplace after verifying.',
    continueUploadLaterBtn: 'Continue & Upload Later',
    continueToReviewBtn: 'Next — Review Request',
    changeFileBtn: 'Replace',
    removeFileBtn: 'Remove',
    viewFullImageBtn: 'Preview',
    uploadFileBtn: 'Upload File',
    rowContractDate: 'Contract Date',
    rowRemainingMonths: 'Remaining Installments',
    rowFeatures: 'Features',
    rowMarketPrice: 'Current Market Price',
    rowInstallment: 'Installment',
    reviewNoteBeforeSubmit: 'Once submitted, our team reviews the unit.',
    savedBadge: 'Saved ✓',
    verifyBoxTitle: 'Final Step — Confirm Your Email',
    verifyBoxDescPrefix: 'We will send a code to your email',
    verifyBoxDescSuffix: '— please check your inbox.',
    sendCodeBtn: 'Send Me the Code',
    confirmCodeBtn: 'Confirm',
    resendCodeBtn: 'Resend',
    codeSentToPrefix: '✉️ The code was sent to your email',
    codeSentBody: 'Open your email now. The code is written in the subject.',
    codeNotReceivedPrefix: 'Still not received? Contact us on WhatsApp',
    codeNotReceivedSuffix: 'and we will help you.',
    emailVerifiedBadge: 'Email Verified Successfully ✓',
    waVerifyBtn: 'Confirm Phone & Unit via WhatsApp',
    waVerifiedBadge: 'WhatsApp Confirmation Opened ✓',
  },
  ru: {
    georgiaLocationLabel: 'Город / Район в Грузии *',
    deliveryMonthsLabel: 'Сколько месяцев осталось до сдачи *',
    deliveryMonthsHelper: 'Укажите количество месяцев',
    contractMonthYearLabel: 'Дата договора *',
    remainingMonthsLabel: 'Остаток месяцев рассрочки *',
    remainingMonthsHelper: 'Если выплачено, 0',
    monthsUnit: 'мес.',
    docsStepTitle: 'Документы и Паспорт',
    docsConditionTitle: 'Загрузка документов обязательна',
    docsConditionDesc: 'Для защиты объект публикуется после проверки.',
    continueUploadLaterBtn: 'Загрузить позже',
    continueToReviewBtn: 'Далее',
    changeFileBtn: 'Заменить',
    removeFileBtn: 'Удалить',
    viewFullImageBtn: 'Просмотр',
    uploadFileBtn: 'Загрузить',
    rowContractDate: 'Дата договора',
    rowRemainingMonths: 'Остаток',
    rowFeatures: 'Особенности',
    rowMarketPrice: 'Рыночная цена',
    rowInstallment: 'Платеж',
    reviewNoteBeforeSubmit: 'После отправки команда проверит объект.',
    savedBadge: 'Сохранено ✓',
    verifyBoxTitle: 'Подтвердите Email',
    verifyBoxDescPrefix: 'Мы отправим код на ваш email',
    verifyBoxDescSuffix: '',
    sendCodeBtn: 'Отправить код',
    confirmCodeBtn: 'Подтвердить',
    resendCodeBtn: 'Снова',
    codeSentToPrefix: '✉️ Код отправлен',
    codeSentBody: 'Проверьте почту.',
    codeNotReceivedPrefix: 'Не пришел код? WhatsApp',
    codeNotReceivedSuffix: '',
    emailVerifiedBadge: 'Email подтвержден ✓',
    waVerifyBtn: 'Подтвердить через WhatsApp',
    waVerifiedBadge: 'WhatsApp подтвержден ✓',
  },
  ka: {
    georgiaLocationLabel: 'ქალაქი / უბანი საქართველოში *',
    deliveryMonthsLabel: 'ჩაბარებამდე დარჩენილი თვეები *',
    deliveryMonthsHelper: 'მიუთითეთ თვეების რაოდენობა',
    contractMonthYearLabel: 'ხელშეკრულების თარიღი *',
    remainingMonthsLabel: 'დარჩენილი განვადება *',
    remainingMonthsHelper: 'თუ დასრულებულია, 0',
    monthsUnit: 'თვე',
    docsStepTitle: 'დოკუმენტები და პასპორტი',
    docsConditionTitle: 'ატვირთვა სავალდებულოა',
    docsConditionDesc: 'უსაფრთხოებისთვის ობიექტი მოწმდება.',
    continueUploadLaterBtn: 'მოგვიანებით ატვირთვა',
    continueToReviewBtn: 'შემდეგი',
    changeFileBtn: 'შეცვლა',
    removeFileBtn: 'წაშლა',
    viewFullImageBtn: 'ნახვა',
    uploadFileBtn: 'ატვირთვა',
    rowContractDate: 'თარიღი',
    rowRemainingMonths: 'განვადება',
    rowFeatures: 'მახასიათებლები',
    rowMarketPrice: 'საბაზრო ფასი',
    rowInstallment: 'განვადება',
    reviewNoteBeforeSubmit: 'გაგზავნის შემდეგ გუნდი გადაამოწმებს.',
    savedBadge: 'შენახულია ✓',
    verifyBoxTitle: 'ელ-ფოსტის დადასტურება',
    verifyBoxDescPrefix: 'კოდი გამოიგზავნება ელ-ფოსტაზე',
    verifyBoxDescSuffix: '',
    sendCodeBtn: 'კოდის გაგზავნა',
    confirmCodeBtn: 'დადასტურება',
    resendCodeBtn: 'თავიდან',
    codeSentToPrefix: '✉️ კოდი გაიგზავნა',
    codeSentBody: 'შეამოწმეთ ფოსტა.',
    codeNotReceivedPrefix: 'არ მოვიდა? WhatsApp',
    codeNotReceivedSuffix: '',
    emailVerifiedBadge: 'დადასტურებულია ✓',
    waVerifyBtn: 'WhatsApp-ით დადასტურება',
    waVerifiedBadge: 'WhatsApp გახსნილია ✓',
  },
}

export function getSellerFormTranslations(
  locale: LocaleCode = 'ar',
  dict?: Dictionary | Record<string, any>
): SellerFormTranslations {
  const base = SELLER_FORM_TRANSLATIONS[locale] || SELLER_FORM_TRANSLATIONS.ar
  const customFormUi = (dict?.sell as Record<string, any>)?.formUi
  if (!customFormUi || typeof customFormUi !== 'object') return base
  return {
    ...base,
    ...customFormUi,
    tabs: { ...base.tabs, ...(customFormUi.tabs || {}) },
    typeSection: { ...base.typeSection, ...(customFormUi.typeSection || {}) },
    photosSection: {
      ...base.photosSection,
      ...(customFormUi.photosSection || {}),
    },
    locationSection: {
      ...base.locationSection,
      ...(customFormUi.locationSection || {}),
    },
    locationModal: {
      ...base.locationModal,
      ...(customFormUi.locationModal || {}),
    },
    detailsSection: {
      ...base.detailsSection,
      ...(customFormUi.detailsSection || {}),
    },
    pricingSection: {
      ...base.pricingSection,
      ...(customFormUi.pricingSection || {}),
    },
    contactSection: {
      ...base.contactSection,
      ...(customFormUi.contactSection || {}),
      validation: {
        ...base.contactSection.validation,
        ...(customFormUi.contactSection?.validation || {}),
      },
    },
    previewSidebar: {
      ...base.previewSidebar,
      ...(customFormUi.previewSidebar || {}),
    },
    reviewSection: {
      ...base.reviewSection,
      ...(customFormUi.reviewSection || {}),
    },
    bottomBar: { ...base.bottomBar, ...(customFormUi.bottomBar || {}) },
  }
}

export function getSellerExtraLabels(
  locale: LocaleCode,
  dict?: Dictionary | Record<string, any>
): SellerExtraLabels {
  const fb = SELLER_EXTRA_FALLBACKS[locale] || SELLER_EXTRA_FALLBACKS.ar
  const customExtra = (dict?.sell as Record<string, any>)?.extraLabels || {}
  return { ...fb, ...customExtra }
}

export function maskEmailDisplay(email?: string): string {
  const clean = String(email || '').trim()
  if (!clean || !clean.includes('@')) return '***@***'
  const [local, domain] = clean.split('@')
  return `${local.slice(0, 2)}***@${domain}`
}

export function isImageFileUrl(url?: string, name?: string): boolean {
  const target = `${url || ''} ${name || ''}`.toLowerCase()
  if (target.includes('.pdf')) return false
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)/i.test(target) || Boolean(url)
}