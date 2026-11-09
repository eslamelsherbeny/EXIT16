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
  requiredBadge: string
  optionalBadge: string
  requiredForPublishBadge: string
  fieldRequiredError: string
  validationModalTitle: string
  validationModalSubtitle: string
  validationModalOkBtn: string
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
    publishRequirementNote: string
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
    streetAutocompleteHint: string
    cantFindAddressTitle: string
    setLocationOnMapBtn: string
    detectMyGpsBtn: string
    reverseGeocodingLoading: string
    pinMovedSuccess: string
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
    docsRequirementBanner: string
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
    finalSectionTitle: string
    finalSectionDescComplete: string
    finalSectionDescMissingMedia: string
    savedAtPrefix: string
    autoSavedPrefix: string
    saveDraftBtn: string
    savingDraftBtn: string
    publishingBtn: string
    publishBtn: string
    submitAndCompleteDocsLaterBtn: string
  }
}

const SELLER_FORM_TRANSLATIONS: Record<LocaleCode, SellerFormTranslations> = {
  ar: {
    pageTitle: 'اعرض وحدتك للتنازل واستكمال الأقساط',
    pageSubtitle:
      'استرد مدفوعاتك بالكامل بالدولار ($) — عمولة البيع 0% على البائع.',
    exitBadge: 'نظام التنازل والأقساط',
    unifiedCurrencyBadge: 'العملة الموحدة: دولار أمريكي ($)',
    requiredBadge: 'إجباري *',
    optionalBadge: 'اختياري',
    requiredForPublishBadge: 'شرط لاعتماد ونشر الوحدة',
    fieldRequiredError: 'هذا الحقل إجباري، يرجى إدخاله للمتابعة',
    validationModalTitle: 'تنبيه — توجد حقول إجبارية ناقصة',
    validationModalSubtitle:
      'للمتابعة إلى الخطوة التالية، يرجى استكمال جميع الحقول الإجبارية المعلّمة باللون الأحمر:',
    validationModalOkBtn: 'حسناً، انتقل لأول حقل ناقص',
    tabs: {
      type: '1 نوع العقار',
      photos: '2 الصور والروابط',
      location: '3 الموقع والمطور',
      details: '4 المواصفات',
      price: '5 السعر والأقساط',
      contact: '6 حساب المالك والإرسال',
    },
    typeSection: {
      title: '1. نوع العقار وحالة البناء',
      subtitle: 'اختر نوع العقار المراد عرضه للتنازل ثم حالة البناء الحالية.',
      whatToDoLabel: 'نوع العملية',
      whatKindLabel: 'ما هو نوع العقار؟ *',
      statusLabel: 'حالة البناء والاستلام *',
    },
    photosSection: {
      title: '2. صور الوحدة وروابط الفيديو',
      subtitle:
        'أظهر التصميم الداخلي والخارجي: غرفة المعيشة، غرف النوم، الحمامات، الشرفة، والإطلالة.',
      publishRequirementNote:
        '💡 رفع صورة واحدة على الأقل شرط لاعتماد ونشر الوحدة في السوق. يمكنك حفظ طلبك الآن كمسودة ورفع الصور لاحقاً من صفحة حسابك.',
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
      title: '3. الموقع الدقيق والعنوان والمطور العقاري',
      subtitleRent:
        'ابحث باسم الشارع أو حرّك الدبوس على الخريطة ليتم ملء العنوان تلقائياً.',
      subtitleSale:
        'اكتب جزءاً من اسم الشارع لاختياره من الاقتراحات، أو حرّك الدبوس على الخريطة لتحديد موقع العقار بالضبط.',
      cityDistrictLabel: 'المدينة / الحي *',
      chooseLocationPlaceholder: 'اضغط لاختيار المدينة والحي أو البحث...',
      developerLabel: 'اسم المطور العقاري (اختياري)',
      developerPlaceholder: 'مثال: ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'اختيار سريع لأشهر المطورين في جورجيا:',
      projectLabel: 'اسم المشروع أو المجمع السكني *',
      projectPlaceholder: 'مثال: Orbi City, King David, White Sails...',
      streetLabel: 'اسم الشارع (اكتب للبحث التلقائي في جورجيا) *',
      streetPlaceholder: 'اكتب اسم الشارع أو المنطقة (مثال: Merab Kostava / Chavchavadze)...',
      streetAutocompleteHint: 'اختر من القائمة المنسدلة أو اضغط على الخريطة بالأسفل لتحديد الموقع تلقائياً',
      cantFindAddressTitle: 'لم تجد عنوانك في البحث؟',
      setLocationOnMapBtn: 'حدّد الموقع مباشرة من الخريطة',
      detectMyGpsBtn: 'تحديد موقعي الحالي (GPS)',
      reverseGeocodingLoading: 'جاري قراءة اسم الشارع والحي من الخريطة...',
      pinMovedSuccess: 'تم التقاط الموقع الدقيق وتحديث عنوان الشارع والحي تلقائياً ✓',
      houseNoLabel: 'رقم المبنى / العمارة',
      houseNoPlaceholder: '47',
      cadastralLabel: 'الرقم العقاري الحكومي (Cadastral Code)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper:
        'اختياري — يربط الوحدة بالسجل العقاري الجورجي الرسمي NAPR',
      mapHeaderTitle: 'خريطة الموقع التفاعلية (اسحب الخريطة أو اضغط عليها لتحديد العقار)',
      mapHint: 'اسحب الخريطة أو اضغط على موقع العقار بالضبط ليتم ملء اسم الشارع والحي وإحداثيات الوحدة تلقائياً',
    },
    locationModal: {
      title: 'اختر المدينة والحي أو ابحث بالشارع في جورجيا',
      searchPlaceholder: 'ابحث عن الشارع، الحي، المدينة أو المشروع (مثال: Merab Kostava)...',
      searchingMapsText: 'جاري البحث الفوري في خرائط جورجيا...',
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
      title: '4. المواصفات والمميزات',
      subtitle:
        'أدخل المساحة وإجمالي الغرف وغرف النوم (إجباري)، ويمكنك تحديد التشطيب والمميزات الإضافية.',
      lockedBanner: 'يرجى اختيار نوع العقار بالأعلى أولاً لفتح حقول المواصفات.',
      conditionLabel: 'حالة التشطيب (اختياري)',
      buildingSeriesLabel: 'طراز المبنى (اختياري)',
      buildingSeriesSub: 'يساعد المشترين على الفلترة السريعة',
      floorTypeLabel: 'نوع الطابق (اختياري)',
      heatingLabel: 'نظام التدفئة (اختياري)',
      buildingMaterialLabel: 'مادة البناء (اختياري)',
      areaLabel: 'المساحة الإجمالية (م²) *',
      kitchenAreaLabel: 'مساحة المطبخ (م²)',
      yearBuiltLabel: 'سنة البناء / التسليم',
      balconyAreaLabel: 'مساحة الشرفة (م²)',
      loggiaAreaLabel: 'مساحة اللوجيا (م²)',
      terraceAreaLabel: 'مساحة التراس / الحديقة (م²)',
      roomsLabel: 'إجمالي عدد الغرف (شامل الصالة) *',
      bedroomsLabel: 'عدد غرف النوم من إجمالي الغرف *',
      roomsBedroomsHint: 'ملاحظة: عدد غرف النوم لا يمكن أن يتخطى إجمالي الغرف.',
      bathroomsLabel: 'عدد الحمامات',
      floorLabel: 'الطابق',
      totalFloorsLabel: 'إجمالي طوابق المبنى',
      maxGuestsLabel: 'أقصى عدد للضيوف',
      featuresTitle: 'المميزات والتجهيزات (اختياري)',
      featuresSubtitle:
        'اختر المميزات المتوفرة فعلياً في العقار لتظهر في صفحة تفاصيل وحدتك.',
      onlineViewingTitle: 'أنا مستعد للمعاينة أونلاين بالفيديو',
      onlineViewingSub:
        'فعّل هذا الخيار إذا كان بإمكانك عرض العقار للمشتري عن بُعد عبر واتساب أو زووم.',
      installmentSaleTitle: 'متاح البيع بالتقسيط على دفعات',
      installmentSaleSub: 'فعّل هذا الخيار إذا كنت تقبل سداد السعر على دفعات.',
    },
    pricingSection: {
      title: '5. السعر والأقساط والمستندات والوصف',
      subtitle: 'حدد تفاصيل العقد الأصلي والمبلغ المدفوع المطلوب كاش بدقة.',
      priceLabel: 'السعر *',
      totalPriceBtn: 'السعر الإجمالي',
      perSqmBtn: 'سعر المتر',
      contractPriceLabel: 'إجمالي سعر الوحدة في العقد ($) *',
      paidAmountLabel: 'المبلغ المدفوع حتى الآن (الكاش المطلوب $) *',
      marketPriceLabel: 'سعر السوق اليوم ($ تقديري - اختياري)',
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
      descriptionLabel: 'وصف تفصيلي للوحدة (اختياري)',
      descriptionPlaceholder:
        'اشرح مميزات الوحدة، الإطلالة، تفاصيل الطابق، وأبرز نقاط القوة للمشتري...',
      docsBoxTitle: 'مستندات الملكية والتنازل (شرط أساسي لاعتماد ونشر الوحدة)',
      docsRequirementBanner:
        '📌 يمكنك حفظ طلبك الآن بدون المستندات واستكمال رفعها لاحقاً من صفحة (حسابي)، ولكن لن تدخل الوحدة مرحلة النشر في السوق العام إلا بعد رفع المستندات الـ 4 ومراجعة الإدارة.',
      docContract: '1. عقد الشراء',
      docReceipts: '2. إيصالات السداد',
      docStatement: '3. كشف الحساب',
      docPassport: '4. جواز السفر',
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
      accountOptionsTitle: 'خيارات الحساب وربط الوحدة:',
      createAccountLinkBtn: 'تأكيد وإنشاء الحساب وربط الوحدة ✓',
      signInSyncPhoneBtn: 'تسجيل الدخول وسحب بياناتي المسجلة ✓',
      signInAnotherAccountBtn: 'تسجيل الدخول بحساب آخر',
      backToCurrentAccountBtn: '← العودة لبيانات حسابي الحالي',
      accountLinkedSuccessMsg:
        'تم إنشاء وربط حسابك وحفظ مسودة الوحدة بنجاح ✓ يمكنك الآن إرسال الوحدة للمراجعة بالأسفل',
      loggedInSyncedSuccessMsg:
        'تم تسجيل الدخول وسحب بياناتك المسجلة بنجاح ✓',
      termsAgreementSuffix: '— وأوافق على شروط وأحكام المنصة *',
      signInToSaveDraftError:
        'يرجى إدخال بيانات حسابك أو تسجيل الدخول في القسم 6 أولاً لحفظ المسودة في حسابك',
      completeAccountToPublishError:
        'يرجى إكمال بيانات الحساب الجديد أو تسجيل الدخول لربط الوحدة باسمك',
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
      title: 'معاينة حية للوحدة',
      subtitle: 'هكذا ستظهر وحدتك أمام المشترين بعد مراجعة الإدارة',
      emptyPhotoTitle: 'لم يتم رفع صور بعد',
      emptyPhotoSub: 'ارفع صور الوحدة — ستظهر معاينة وحدتك هنا مباشرة',
      priceOnRequest: 'السعر عند الإدخال',
      perDay: ' / يومياً',
      perMonth: ' / شهرياً',
      cashRequiredSuffix: ' (الكاش المطلوب)',
      bedsShort: 'غرف نوم',
      strengthTitle: 'جاهزية الوحدة للمراجعة والنشر',
      strengthGreat: 'وحدة مكتملة وممتازة — جاهزة لمراجعة الإدارة فوراً!',
      strengthGood: 'أكمل البيانات الإجبارية والصور والمستندات لتسريع النشر',
      tipPhotos: 'أضف صوراً واضحة للوحدة',
      tipLocation: 'حدد الموقع الدقيق واسم الشارع',
      tipDetails: 'أكمل مواصفات ومساحة العقار',
      tipDescription: 'اكتب وصفاً كاملاً للعقار',
    },
    reviewSection: {
      fastTrackPhoneTitle:
        'لتسريع مراجعة وحدتك وتوثيق رقم هاتفك بعلامة التوثيق ✓:',
      promoSubDesc:
        'اختر الباقة المناسبة وادفع بالبطاقة لتظهر وحدتك في صدارة الصفحة الرئيسية والفرص المتاحة فور موافقة الأدمن.',
      payAndActivatePrefix: 'ادفع',
      payAndActivateMiddle: 'وتفعيل باقة',
      daySingular: 'يوم',
      daysPlural: 'أيام',
      boostRecordedPrefix: 'تم تسجيل طلب تفعيل باقة',
      boostRecordedSuffix:
        'سيتم تفعيل التمييز تلقائياً فور مراجعة الأدمن للوحدة والدفع.',
      previewPropertyBtn: 'معاينة صفحة الوحدة',
      pkgStarter: 'بداية · يوم واحد',
      pkgRecommended: 'موصى به 🔥 · يوم واحد',
      pkgTwoDays: 'SUPER VIP · يومان',
      pkgPopular: 'شائع · 7 أيام',
      pkgPro: 'PRO -30% · 17 يوماً',
    },
    bottomBar: {
      finalSectionTitle: 'إرسال طلب عرض الوحدة أو الحفظ كمسودة',
      finalSectionDescComplete:
        'جميع بياناتك وصورك ومستنداتك مكتملة 100%! اضغط بالأسفل لإرسال وحدتك مباشرة إلى مراجعة الإدارة.',
      finalSectionDescMissingMedia:
        'ملاحظة هامة: يمكنك إرسال وحفظ بيانات وحدتك الآن، وسيظهر لك في صفحة (حسابي) ما يتبقى عليك من صور أو مستندات لترفعها في أي وقت حتى توافق الإدارة على نشرها.',
      savedAtPrefix: 'تم حفظ المسودة في حسابك الساعة',
      autoSavedPrefix: 'اكتمال الأقسام',
      saveDraftBtn: 'حفظ كمسودة واستكمال لاحقاً في حسابي',
      savingDraftBtn: 'جاري حفظ المسودة...',
      publishingBtn: 'جاري إرسال الطلب...',
      publishBtn: 'إرسال الوحدة لمراجعة الإدارة والاعتماد',
      submitAndCompleteDocsLaterBtn: 'حفظ بيانات الوحدة واستكمال الصور/المستندات من حسابي',
    },
  },
  en: {
    pageTitle: 'Submit Your Unit for Installment Exit',
    pageSubtitle:
      'Recover 100% of your paid installments in USD ($) — 0% seller commission.',
    exitBadge: 'Installment Exit System',
    unifiedCurrencyBadge: 'Unified Currency: USD ($)',
    requiredBadge: 'Required *',
    optionalBadge: 'Optional',
    requiredForPublishBadge: 'Required for Admin Approval',
    fieldRequiredError: 'This compulsory field is required',
    validationModalTitle: 'Error — Compulsory Fields Missing',
    validationModalSubtitle:
      'To proceed to the next step, please fill out all compulsory fields marked in red:',
    validationModalOkBtn: 'OK, Go to First Missing Field',
    tabs: {
      type: '1 Property Type',
      photos: '2 Photos & Media',
      location: '3 Location',
      details: '4 Specifications',
      price: '5 Price & Terms',
      contact: '6 Owner & Submit',
    },
    typeSection: {
      title: '1. Property Type & Building Status',
      subtitle:
        'Select the property type and current building status for your installment exit.',
      whatToDoLabel: 'Deal Type',
      whatKindLabel: 'What kind of property? *',
      statusLabel: 'Building & Handover Status *',
    },
    photosSection: {
      title: '2. Unit Photos, Video & 3D Tour',
      subtitle:
        'Show interior and exterior: living room, bedrooms, bathrooms, balcony, and view.',
      publishRequirementNote:
        '💡 Uploading at least 1 photo is required before Admin publishes your unit. You can save as draft now and upload photos later from My Account.',
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
      title: '3. Exact Location, Street & Developer',
      subtitleRent:
        'Search by street name or drag the pin on the map to auto-fill address.',
      subtitleSale:
        'Type part of the street name for live suggestions across Georgia, or move the map pin to set exact building location.',
      cityDistrictLabel: 'City / District *',
      chooseLocationPlaceholder: 'Click to select city, district or search street...',
      developerLabel: 'Developer Name (Optional)',
      developerPlaceholder: 'e.g. ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'Quick-select popular developers in Georgia:',
      projectLabel: 'Project / Complex Name *',
      projectPlaceholder: 'e.g. Orbi City, King David, White Sails...',
      streetLabel: 'Street Name (Live Georgia Search) *',
      streetPlaceholder: 'Type street or area (e.g. Merab Kostava / Chavchavadze)...',
      streetAutocompleteHint: 'Select from dropdown suggestions or click on the map below',
      cantFindAddressTitle: "Can't find your address?",
      setLocationOnMapBtn: 'Set location on map instead',
      detectMyGpsBtn: 'Detect my GPS location',
      reverseGeocodingLoading: 'Reading street & district from map coordinates...',
      pinMovedSuccess: 'Exact location captured & street address updated ✓',
      houseNoLabel: 'Building / House Nº',
      houseNoPlaceholder: '47',
      cadastralLabel: 'Cadastral Code (NAPR)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper: 'Optional — links unit to Georgian Public Registry NAPR',
      mapHeaderTitle: 'Interactive 3D Map (Drag or click map to set exact building)',
      mapHint: 'Drag the map or click on your building to auto-fill street, district and exact coordinates',
    },
    locationModal: {
      title: 'Select City & District or Search Street in Georgia',
      searchPlaceholder: 'Search street, district, city or project (e.g. Merab Kostava)...',
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
      title: '4. Specifications & Features',
      subtitle:
        'Fill in compulsory area, total rooms, and bedrooms. Other specs are optional.',
      lockedBanner: 'Please select a property type above to unlock specifications.',
      conditionLabel: 'Finishing Condition (Optional)',
      buildingSeriesLabel: 'Building Series (Optional)',
      buildingSeriesSub: 'Helps buyers filter quickly',
      floorTypeLabel: 'Floor Type (Optional)',
      heatingLabel: 'Heating System (Optional)',
      buildingMaterialLabel: 'Building Material (Optional)',
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
      featuresTitle: 'Features & Amenities (Optional)',
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
      title: '5. Price, Installments, Documents & Description',
      subtitle:
        'Enter the original contract price, paid cash amount, and remaining installment details.',
      priceLabel: 'Price *',
      totalPriceBtn: 'Total price',
      perSqmBtn: 'Price per m²',
      contractPriceLabel: 'Total Contract Price ($) *',
      paidAmountLabel: 'Paid Amount So Far (Required Cash $) *',
      marketPriceLabel: 'Current Market Price ($ Est. - Optional)',
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
      descriptionLabel: 'Detailed Property Description (Optional)',
      descriptionPlaceholder:
        'Describe the property layout, view, floor advantages, and key highlights...',
      docsBoxTitle: 'Ownership Documents (Required for Market Publication)',
      docsRequirementBanner:
        '📌 You can save your unit now and upload documents later from (My Account), but the unit will only be published in the public market after uploading the 4 documents for Admin review.',
      docContract: '1. Purchase Contract',
      docReceipts: '2. Payment Receipts',
      docStatement: '3. Account Statement',
      docPassport: '4. Passport Copy',
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
      accountOptionsTitle: 'Account & unit ownership options:',
      createAccountLinkBtn: 'Create Account & Save Unit Draft ✓',
      signInSyncPhoneBtn: 'Sign In & Sync My Details ✓',
      signInAnotherAccountBtn: 'Sign in with another account',
      backToCurrentAccountBtn: '← Back to my current account',
      accountLinkedSuccessMsg:
        'Account created and draft saved ✓ You can now submit your unit below',
      loggedInSyncedSuccessMsg: 'Signed in and contact details synced ✓',
      termsAgreementSuffix: '— and I agree to the platform terms & conditions *',
      signInToSaveDraftError:
        'Please sign in or register in Section 6 first to save a draft to your account',
      completeAccountToPublishError:
        'Please complete your account registration or sign in to link this unit',
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
      title: 'Live Unit Preview',
      subtitle: 'This is how buyers will see your unit after Admin approval',
      emptyPhotoTitle: 'No photos uploaded yet',
      emptyPhotoSub: 'Upload a photo — your live preview appears here',
      priceOnRequest: 'Price on request',
      perDay: ' /day',
      perMonth: ' /month',
      cashRequiredSuffix: ' (Cash Required)',
      bedsShort: 'Beds',
      strengthTitle: 'Readiness for Admin Review',
      strengthGreat: 'Complete unit — ready for immediate Admin review!',
      strengthGood: 'Complete compulsory fields, photos & docs for approval',
      tipPhotos: 'Add clear property photos',
      tipLocation: 'Specify street and exact location',
      tipDetails: 'Complete property area & rooms',
      tipDescription: 'Write a detailed description',
    },
    reviewSection: {
      fastTrackPhoneTitle:
        'To fast-track unit review & verify your phone number ✓:',
      promoSubDesc:
        'Choose a boost package to feature your unit at the top of the Homepage and Opportunities upon Admin approval.',
      payAndActivatePrefix: 'Pay',
      payAndActivateMiddle: 'for',
      daySingular: 'day',
      daysPlural: 'days',
      boostRecordedPrefix: 'Boost request recorded:',
      boostRecordedSuffix:
        'It will activate automatically upon Admin review and payment confirmation.',
      previewPropertyBtn: 'Preview Unit Page',
      pkgStarter: 'Starter · 1 day',
      pkgRecommended: 'Recommended 🔥 · 1 day',
      pkgTwoDays: 'SUPER VIP · 2 days',
      pkgPopular: 'Popular · 7 days',
      pkgPro: 'PRO -30% · 17 days',
    },
    bottomBar: {
      finalSectionTitle: 'Submit Unit for Admin Review or Save Draft',
      finalSectionDescComplete:
        'All your unit details, photos, and documents are 100% complete! Click below to submit your unit for Admin review.',
      finalSectionDescMissingMedia:
        'Important Note: You can save and submit your unit details now, and upload the remaining photos or documents anytime from (My Account) so Admin can approve and publish it.',
      savedAtPrefix: 'Draft saved at',
      autoSavedPrefix: 'Sections completed',
      saveDraftBtn: 'Save as Draft & Continue Later in My Account',
      savingDraftBtn: 'Saving draft...',
      publishingBtn: 'Submitting...',
      publishBtn: 'Submit Unit for Admin Review & Approval',
      submitAndCompleteDocsLaterBtn: 'Save Unit Details & Complete Photos/Docs in My Account',
    },
  },
  ru: {
    pageTitle: 'Разместить объект по переуступке рассрочки',
    pageSubtitle:
      'Верните 100% выплаченных средств в долларах ($) — комиссия для продавца 0%.',
    exitBadge: 'Переуступка рассрочки',
    unifiedCurrencyBadge: 'Единая валюта: USD ($)',
    requiredBadge: 'Обязательно *',
    optionalBadge: 'Необязательно',
    requiredForPublishBadge: 'Обязательно для публикации',
    fieldRequiredError: 'Это обязательное поле необходимо заполнить',
    validationModalTitle: 'Внимание — не заполнены обязательные поля',
    validationModalSubtitle:
      'Для продолжения заполните все обязательные поля, выделенные красным цветом:',
    validationModalOkBtn: 'ОК, перейти к первому полю',
    tabs: {
      type: '1 Тип объекта',
      photos: '2 Фото и медиа',
      location: '3 Локация',
      details: '4 Характеристики',
      price: '5 Цена и условия',
      contact: '6 Аккаунт и отправка',
    },
    typeSection: {
      title: '1. Тип недвижимости и статус здания',
      subtitle: 'Выберите тип объекта и текущий статус строительства.',
      whatToDoLabel: 'Тип сделки',
      whatKindLabel: 'Какой тип недвижимости? *',
      statusLabel: 'Статус строительства *',
    },
    photosSection: {
      title: '2. Фотографии, видео и 3D-тур',
      subtitle:
        'Покажите интерьер и экстерьер: гостиную, спальни, санузел, балкон и вид из окон.',
      publishRequirementNote:
        '💡 Загрузка хотя бы 1 фото обязательна для публикации на рынке. Вы можете сохранить черновик сейчас и загрузить фото позже в личном кабинете.',
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
      title: '3. Точное местоположение, улица и застройщик',
      subtitleRent:
        'Введите улицу для автоподсказок или передвиньте пин на карте.',
      subtitleSale:
        'Начните вводить название улицы для поиска по всей Грузии или укажите точку прямо на карте.',
      cityDistrictLabel: 'Город / Район *',
      chooseLocationPlaceholder: 'Нажмите для выбора города, района или поиска...',
      developerLabel: 'Застройщик (Необязательно)',
      developerPlaceholder: 'Напр.: ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'Быстрый выбор популярных застройщиков Грузии:',
      projectLabel: 'Название ЖК / Проекта *',
      projectPlaceholder: 'Напр.: Orbi City, King David, White Sails...',
      streetLabel: 'Улица (Живой поиск по Грузии) *',
      streetPlaceholder: 'Введите улицу или район (напр.: Merab Kostava / Chavchavadze)...',
      streetAutocompleteHint: 'Выберите из списка подсказок или укажите точку на карте ниже',
      cantFindAddressTitle: 'Не нашли точный адрес в поиске?',
      setLocationOnMapBtn: 'Указать точку на карте',
      detectMyGpsBtn: 'Мое местоположение (GPS)',
      reverseGeocodingLoading: 'Определение адреса по координатам карты...',
      pinMovedSuccess: 'Точная локация и улица успешно обновлены ✓',
      houseNoLabel: 'Номер дома',
      houseNoPlaceholder: '47',
      cadastralLabel: 'Кадастровый код (NAPR)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper: 'Необязательно — привязка к реестру недвижимости Грузии',
      mapHeaderTitle: 'Интерактивная 3D-карта (Передвигайте карту или нажмите на дом)',
      mapHint: 'Передвиньте карту или нажмите на здание — улица, район и координаты заполнятся автоматически',
    },
    locationModal: {
      title: 'Выберите город и район или найдите улицу в Грузии',
      searchPlaceholder: 'Поиск улицы, района, города или ЖК (напр.: Merab Kostava)...',
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
      title: '4. Характеристики и удобства',
      subtitle: 'Укажите обязательную площадь и комнаты. Остальные поля необязательны.',
      lockedBanner: 'Выберите тип недвижимости выше, чтобы открыть поля.',
      conditionLabel: 'Состояние / Ремонт (Необязательно)',
      buildingSeriesLabel: 'Серия дома (Необязательно)',
      buildingSeriesSub: 'Помогает покупателям быстрее находить объект',
      floorTypeLabel: 'Тип этажа (Необязательно)',
      heatingLabel: 'Отопление (Необязательно)',
      buildingMaterialLabel: 'Материал здания (Необязательно)',
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
      featuresTitle: 'Удобства и оснащение (Необязательно)',
      featuresSubtitle: 'Отметьте все удобства, которые реально есть в объекте.',
      onlineViewingTitle: 'Готов к онлайн-показу по видеосвязи',
      onlineViewingSub:
        'Отметьте, если можете показать объект удаленно через WhatsApp или Zoom.',
      installmentSaleTitle: 'Возможна продажа в рассрочку',
      installmentSaleSub: 'Отметьте, если готовы принимать оплату частями.',
    },
    pricingSection: {
      title: '5. Цена, рассрочка, документы и описание',
      subtitle: 'Укажите полную цену по договору, выплаченную сумму и остаток рассрочки.',
      priceLabel: 'Цена *',
      totalPriceBtn: 'Общая цена',
      perSqmBtn: 'Цена за м²',
      contractPriceLabel: 'Полная цена по договору ($) *',
      paidAmountLabel: 'Выплачено на сегодня (Сумма на руки $) *',
      marketPriceLabel: 'Рыночная цена сегодня ($ - Необязательно)',
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
      descriptionLabel: 'Подробное описание объекта (Необязательно)',
      descriptionPlaceholder:
        'Опишите планировку, вид из окон, преимущества этажа и комплекса...',
      docsBoxTitle: 'Документы на объект (Обязательно для публикации на рынке)',
      docsRequirementBanner:
        '📌 Вы можете сохранить данные объекта сейчас и загрузить документы позже в (Личном кабинете), но объект будет опубликован на рынке только после загрузки 4 документов и проверки администрацией.',
      docContract: '1. Договор купли',
      docReceipts: '2. Квитанции оплаты',
      docStatement: '3. Выписка со счета',
      docPassport: '4. Паспорт',
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
      accountOptionsTitle: 'Параметры аккаунта и привязки объекта:',
      createAccountLinkBtn: 'Создать аккаунт и сохранить черновик ✓',
      signInSyncPhoneBtn: 'Войти и синхронизировать данные ✓',
      signInAnotherAccountBtn: 'Войти в другой аккаунт',
      backToCurrentAccountBtn: '← Вернуться к текущему аккаунту',
      accountLinkedSuccessMsg:
        'Аккаунт создан и черновик сохранен ✓ Теперь отправьте объект на проверку ниже',
      loggedInSyncedSuccessMsg: 'Вход выполнен, данные синхронизированы ✓',
      termsAgreementSuffix: '— и принимаю правила платформы *',
      signInToSaveDraftError:
        'Войдите или зарегистрируйтесь в разделе 6 для сохранения черновика',
      completeAccountToPublishError:
        'Заполните данные регистрации или войдите в аккаунт для отправки объекта',
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
      title: 'Предпросмотр объекта',
      subtitle: 'Так покупатели увидят ваш объект после проверки',
      emptyPhotoTitle: 'Фото еще не загружены',
      emptyPhotoSub: 'Загрузите фото — предпросмотр появится здесь',
      priceOnRequest: 'Цена по запросу',
      perDay: ' /сут.',
      perMonth: ' /мес.',
      cashRequiredSuffix: ' (На руки)',
      bedsShort: 'спальни',
      strengthTitle: 'Готовность к проверке',
      strengthGreat: 'Отличное заполнение — готово к проверке администрацией!',
      strengthGood: 'Заполните обязательные поля, фото и документы',
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
      finalSectionTitle: 'Отправка объекта на проверку или сохранение черновика',
      finalSectionDescComplete:
        'Все данные, фото и документы заполнены на 100%! Нажмите ниже, чтобы отправить объект на проверку администрации.',
      finalSectionDescMissingMedia:
        'Важно: Вы можете сохранить данные объекта сейчас и загрузить недостающие фото или документы позже в (Личном кабинете) для одобрения публикации.',
      savedAtPrefix: 'Черновик сохранен в',
      autoSavedPrefix: 'Заполнено разделов',
      saveDraftBtn: 'Сохранить черновик и продолжить позже в кабинете',
      savingDraftBtn: 'Сохранение черновика...',
      publishingBtn: 'Отправка...',
      publishBtn: 'Отправить объект на проверку администрации',
      submitAndCompleteDocsLaterBtn: 'Сохранить объект и загрузить фото/документы в кабинете',
    },
  },
  ka: {
    pageTitle: 'განათავსეთ ქონება განვადების გადაბარებით',
    pageSubtitle:
      'დაიბრუნეთ გადახდილი თანხის 100% დოლარში ($) — საკომისიო გამყიდველისთვის 0%.',
    exitBadge: 'განვადების გადაბარება',
    unifiedCurrencyBadge: 'ერთიანი ვალუტა: USD ($)',
    requiredBadge: 'სავალდებულო *',
    optionalBadge: 'არასავალდებულო',
    requiredForPublishBadge: 'სავალდებულოა გამოსაქვეყნებლად',
    fieldRequiredError: 'ეს სავალდებულო ველი შესავსებია',
    validationModalTitle: 'ყურადღება — სავალდებულო ველები არ არის შევსებული',
    validationModalSubtitle:
      'გასაგრძელებლად გთხოვთ შეავსოთ წითლად მონიშნული ყველა სავალდებულო ველი:',
    validationModalOkBtn: 'კარგი, გადადით პირველ ველზე',
    tabs: {
      type: '1 ქონების ტიპი',
      photos: '2 ფოტო და მედია',
      location: '3 მდებარეობა',
      details: '4 მახასიათებლები',
      price: '5 ფასი და პირობები',
      contact: '6 ანგარიში და გაგზავნა',
    },
    typeSection: {
      title: '1. ქონების ტიპი და მშენებლობის სტატუსი',
      subtitle: 'აირჩიეთ ქონების სახეობა და მშენებლობის მიმდინარე სტატუსი.',
      whatToDoLabel: 'გარიგების ტიპი',
      whatKindLabel: 'რა ტიპის ქონებაა? *',
      statusLabel: 'მშენებლობის სტატუსი *',
    },
    photosSection: {
      title: '2. ფოტოები, ვიდეო და 3D ტურის ბმულები',
      subtitle:
        'აჩვენეთ ინტერიერი და ექსტერიერი: მისაღები, საძინებელი, სველი წერტილი, აივანი და ხედი.',
      publishRequirementNote:
        '💡 მინიმუმ 1 ფოტოს ატვირთვა აუცილებელია ქონების ბაზარზე გამოსაქვეყნებლად. შეგიძლიათ შეინახოთ მონახაზი ახლა და ფოტოები მოგვიანებით ატვირთოთ თქვენი ანგარიშიდან.',
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
      title: '3. ზუსტი მდებარეობა, ქუჩა და დეველოპერი',
      subtitleRent:
        'მოძებნეთ ქუჩის სახელით ან გადაადგილეთ პინი რუკაზე მისამართის შესავსებად.',
      subtitleSale:
        'ჩაწერეთ ქუჩის სახელი სწრაფი ძიებისთვის ან მონიშნეთ ზუსტი ადგილი პირდაპირ რუკაზე.',
      cityDistrictLabel: 'ქალაქი / უბანი *',
      chooseLocationPlaceholder: 'დააჭირეთ ქალაქის, უბნის ან ქუჩის ასარჩევად...',
      developerLabel: 'დეველოპერი (არასავალდებულო)',
      developerPlaceholder: 'მაგ.: ORBI Group, Archi, m², Next Group...',
      popularDevelopersHint: 'საქართველოს პოპულარული დეველოპერები:',
      projectLabel: 'პროექტის / კომპლექსის სახელი *',
      projectPlaceholder: 'მაგ.: Orbi City, King David, White Sails...',
      streetLabel: 'ქუჩის სახელი (სწრაფი ძიება საქართველოში) *',
      streetPlaceholder: 'ჩაწერეთ ქუჩა ან უბანი (მაგ.: Merab Kostava / Chavchavadze)...',
      streetAutocompleteHint: 'აირჩიეთ შემოთავაზებული სიიდან ან დააჭირეთ რუკას ქვემოთ',
      cantFindAddressTitle: 'ვერ პოულობთ მისამართს?',
      setLocationOnMapBtn: 'მონიშნეთ მდებარეობა რუკაზე',
      detectMyGpsBtn: 'ჩემი GPS მდებარეობა',
      reverseGeocodingLoading: 'მისამართის წაკითხვა რუკის კოორდინატებიდან...',
      pinMovedSuccess: 'ზუსტი მდებარეობა და ქუჩის მისამართი განახლდა ✓',
      houseNoLabel: 'სახლის / კორპუსის Nº',
      houseNoPlaceholder: '47',
      cadastralLabel: 'საკადასტრო კოდი (NAPR)',
      cadastralPlaceholder: '01.10.01.001.001',
      cadastralHelper: 'არასავალდებულო — საჯარო რეესტრის კოდი',
      mapHeaderTitle: 'ინტერაქტიული 3D რუკა (გადაადგილეთ რუკა ან დააჭირეთ შენობას)',
      mapHint: 'გადაადგილეთ რუკა ან დააჭირეთ შენობას ქუჩისა და კოორდინატების ავტომატურად შესავსებად',
    },
    locationModal: {
      title: 'აირჩიეთ ქალაქი და უბანი ან მოძებნეთ ქუჩა',
      searchPlaceholder: 'ქუჩა, უბანი, ქალაქი ან პროექტი (მაგ.: Merab Kostava)...',
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
      title: '4. მახასიათებლები და კეთილმოწყობა',
      subtitle: 'შეავსეთ სავალდებულო ფართობი და ოთახები.',
      lockedBanner: 'ველების გასახსნელად ზემოთ აირჩიეთ ქონების ტიპი.',
      conditionLabel: 'მდგომარეობა / რემონტი (არასავალდებულო)',
      buildingSeriesLabel: 'შენობის პროექტი (არასავალდებულო)',
      buildingSeriesSub: 'ეხმარება მყიდველებს სწრაფ ფილტრაციაში',
      floorTypeLabel: 'სართულის ტიპი (არასავალდებულო)',
      heatingLabel: 'გათბობა (არასავალდებულო)',
      buildingMaterialLabel: 'სამშენებლო მასალა (არასავალდებულო)',
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
      featuresTitle: 'მახასიათებლები (არასავალდებულო)',
      featuresSubtitle: 'მონიშნეთ ყველა არსებული კეთილმოწყობა.',
      onlineViewingTitle: 'მზად ვარ ონლაინ ვიდეო ჩვენებისთვის',
      onlineViewingSub:
        'მონიშნეთ, თუ შეგიძლიათ ქონების დისტანციურად ჩვენება WhatsApp ან Zoom-ით.',
      installmentSaleTitle: 'შესაძლებელია შიდა განვადება',
      installmentSaleSub: 'მონიშნეთ, თუ თანახმა ხართ ნაწილ-ნაწილ გადახდაზე.',
    },
    pricingSection: {
      title: '5. ფასი, განვადება, დოკუმენტები და აღწერა',
      subtitle: 'მიუთითეთ კონტრაქტის ფასი, გადახდილი თანხა და დარჩენილი განვადება.',
      priceLabel: 'ფასი *',
      totalPriceBtn: 'სრული ფასი',
      perSqmBtn: 'ფასი მ²-ზე',
      contractPriceLabel: 'კონტრაქტის სრული ფასი ($) *',
      paidAmountLabel: 'გადახდილი თანხა (საჭირო თანხა ხელზე $) *',
      marketPriceLabel: 'საბაზრო ფასი დღეს ($ - არასავალდებულო)',
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
      overdueInstallmentsToggle: 'არის ვადაგადაცილებული შენატანები',
      overdueCountLabel: 'ვადაგადაცილებული თვეების რაოდენობა',
      overdueTotalAmountLabel: 'ვადაგადაცილებული თანხა სულ ($)',
      rentDailyLabel: 'დღიური ფასი *',
      rentMonthlyLabel: 'თვიური ქირის ფასი *',
      negotiableLabel: 'საჭირო თანხა (ხელზე) ექვემდებარება შეთანხმებას',
      exchangePossibleLabel: 'შესაძლებელია გაცვლა',
      discountAmountLabel: 'მაქსიმალური დასაშვები ფასდაკლება ($ არასავალდებულო)',
      districtGuideTitle: 'უბნის ფასების გზამკვლევი',
      districtGuideSub: 'საშუალო საბაზრო ფასი ამ უბანში: $1,150 – $1,650 / მ².',
      descriptionLabel: 'დეტალური აღწერა (არასავალდებულო)',
      descriptionPlaceholder:
        'აღწერეთ ქონების უპირატესობები, ხედი, სართული და კომპლექსის პირობები...',
      docsBoxTitle: 'საკუთრების დოკუმენტები (სავალდებულოა გამოსაქვეყნებლად)',
      docsRequirementBanner:
        '📌 შეგიძლიათ შეინახოთ მონაცემები ახლა და დოკუმენტები მოგვიანებით ატვირთოთ (ჩემი ანგარიშიდან), მაგრამ ობიექტი გამოქვეყნდება მხოლოდ 4 დოკუმენტის ატვირთვისა და ადმინისტრაციის მიერ შემოწმების შემდეგ.',
      docContract: '1. ნასყიდობის კონტრაქტი',
      docReceipts: '2. გადახდის ქვითრები',
      docStatement: '3. ამონაწერი',
      docPassport: '4. პასპორტი',
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
      createAccountLinkBtn: 'ანგარიშის შექმნა და მონახაზის შენახვა ✓',
      signInSyncPhoneBtn: 'შესვლა და მონაცემების სინქრონიზაცია ✓',
      signInAnotherAccountBtn: 'სხვა ანგარიშით შესვლა',
      backToCurrentAccountBtn: '← ჩემს ანგარიშზე დაბრუნება',
      accountLinkedSuccessMsg:
        'ანგარიში შეიქმნა და მონახაზი შენახულია ✓ ახლა გაგზავნეთ ობიექტი ქვემოთ',
      loggedInSyncedSuccessMsg: 'ავტორიზაცია წარმატებულია ✓',
      termsAgreementSuffix: '— და ვეთანხმები პლატფორმის წესებს *',
      signInToSaveDraftError:
        'მონახაზის შესანახად გთხოვთ გაიაროთ ავტორიზაცია მე-6 სექციაში',
      completeAccountToPublishError:
        'გასაგზავნად გთხოვთ შეავსოთ რეგისტრაციის ველები ან შეხვიდეთ ანგარიშში',
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
      subtitle: 'ასე დაინახავენ მყიდველები თქვენს ობიექტს დადასტურების შემდეგ',
      emptyPhotoTitle: 'ფოტოები ჯერ არ არის ატვირთული',
      emptyPhotoSub: 'ატვირთეთ ფოტო — გადახედვა აქ გამოჩნდება',
      priceOnRequest: 'ფასი შეთანხმებით',
      perDay: ' /დღე',
      perMonth: ' /თვე',
      cashRequiredSuffix: ' (საჭირო თანხა)',
      bedsShort: 'საძინებელი',
      strengthTitle: 'მზადყოფნა შემოწმებისთვის',
      strengthGreat: 'სრულად შევსებულია — მზადაა ადმინისტრაციის შემოწმებისთვის!',
      strengthGood: 'შეავსეთ სავალდებულო ველები, ფოტოები და დოკუმენტები',
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
      finalSectionTitle: 'ობიექტის გაგზავნა შემოწმებაზე ან მონახაზის შენახვა',
      finalSectionDescComplete:
        'ყველა მონაცემი, ფოტო და დოკუმენტი შევსებულია 100%-ით! დააჭირეთ ქვემოთ ადმინისტრაციაში გასაგზავნად.',
      finalSectionDescMissingMedia:
        'მნიშვნელოვანია: შეგიძლიათ შეინახოთ მონაცემები ახლა და დარჩენილი ფოტოები ან დოკუმენტები მოგვიანებით ატვირთოთ (ჩემი ანგარიშიდან).',
      savedAtPrefix: 'მონახაზი შენახულია',
      autoSavedPrefix: 'შევსებულია სექციები',
      saveDraftBtn: 'მონახაზად შენახვა და მოგვიანებით გაგრძელება',
      savingDraftBtn: 'ინახება...',
      publishingBtn: 'იგზავნება...',
      publishBtn: 'ობიექტის გაგზავნა ადმინისტრაციის შემოწმებაზე',
      submitAndCompleteDocsLaterBtn: 'მონაცემების შენახვა და ფოტო/დოკუმენტების ანგარიშიდან ატვირთვა',
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
    continueUploadLaterBtn: 'حفظ واستكمال الرفع لاحقاً في حسابي',
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
    confirmCodeBtn: 'تأكيد وإرسال',
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
    continueUploadLaterBtn: 'Save & Upload Later in My Account',
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
    confirmCodeBtn: 'Confirm & Submit',
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
    continueUploadLaterBtn: 'Сохранить и загрузить позже в кабинете',
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
    continueUploadLaterBtn: 'შენახვა და მოგვიანებით ატვირთვა',
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

import {
  CONDITION_OPTIONS,
  getOptionLabel,
  SIVRCE_FEATURE_GROUPS,
  toEnglishDigits,
  type LocalizedOptionItem,
} from './seller-options-data'

export const AI_DESCRIPTION_I18N: Record<
  LocaleCode,
  {
    generateBtn: string
    generatingBtn: string
    generatedBadge: string
    helperHint: string
  }
> = {
  ar: {
    generateBtn: 'كتابة الوصف بالذكاء الاصطناعي (AI)',
    generatingBtn: 'جاري صياغة الوصف من بيانات وحدتك...',
    generatedBadge: 'تم توليد الوصف من بيانات وحدتك بنجاح ✓',
    helperHint:
      'اضغط على زر الذكاء الاصطناعي لكتابة وصف احترافي جذاب تلقائياً من البيانات التي أدخلتها.',
  },
  en: {
    generateBtn: 'Generate Description with AI',
    generatingBtn: 'Generating description from your unit data...',
    generatedBadge: 'AI Description generated from your unit data ✓',
    helperHint:
      'Click the AI button to automatically craft a professional description from your entered details.',
  },
  ru: {
    generateBtn: 'Сгенерировать описание с ИИ (AI)',
    generatingBtn: 'Создание описания по данным вашего объекта...',
    generatedBadge: 'Описание успешно создано на основе данных объекта ✓',
    helperHint:
      'Нажмите кнопку ИИ, чтобы автоматически составить профессиональное описание из введенных данных.',
  },
  ka: {
    generateBtn: 'აღწერის გენერირება ხელოვნური ინტელექტით (AI)',
    generatingBtn: 'აღწერა იქმნება თქვენი მონაცემებით...',
    generatedBadge: 'აღწერა წარმატებით შეიქმნა ✓',
    helperHint:
      'დააჭირეთ AI ღილაკს, რათა ავტომატურად შეიქმნას პროფესიონალური აღწერა შეყვანილი მონაცემებიდან.',
  },
}

export function buildSmartPropertyDescription({
  locale,
  areaName,
  form,
  selected,
  buildingStatus,
}: {
  locale: LocaleCode
  areaName: string
  form: Record<string, string>
  selected: Record<string, string[]>
  buildingStatus?: string
}): string {
  const street = form.exactStreet?.trim() || ''
  const project = form.project?.trim() || ''
  const developer = form.developer?.trim() || ''
  const size = form.areaSize?.trim() || ''
  const rooms = form.rooms?.trim() || ''
  const bedrooms = form.bedrooms?.trim() || ''
  const bathrooms = form.bathrooms?.trim() || '1'
  const floor = form.floor?.trim() || ''
  const totalFloors = form.totalFloors?.trim() || ''
  const isUnderConst = buildingStatus === 'Under construction'
  const deliveryYear = form.deliveryYear || '2026'

  const contractPriceNum = Number(
    toEnglishDigits(form.contractPrice || '0').replace(/,/g, '')
  )
  const paidAmountNum = Number(
    toEnglishDigits(form.paidAmount || '0').replace(/,/g, '')
  )
  const installmentNum = Number(
    toEnglishDigits(form.installment || '0').replace(/,/g, '')
  )
  const remainingMonthsNum = Number(
    toEnglishDigits(form.remainingMonths || '0').replace(/[^0-9]/g, '')
  )
  const remainingAmount = Math.max(0, contractPriceNum - paidAmountNum)

  const finishingId = selected.finishing?.[0] || ''
  const conditionObj = (
    CONDITION_OPTIONS as readonly LocalizedOptionItem<string>[]
  ).find((c) => c.id === finishingId)
  const conditionLabel = conditionObj
    ? getOptionLabel(conditionObj, locale)
    : ''

  // حل جذري لخطأ TypeScript مع المصفوفات المعرفة بـ readonly
  const allFeatureItems: LocalizedOptionItem<string>[] = []
  for (const grp of SIVRCE_FEATURE_GROUPS) {
    for (const item of grp.items) {
      allFeatureItems.push(item as LocalizedOptionItem<string>)
    }
  }

  const selectedFeatureLabels = (selected.features || [])
    .map((fId) => {
      const found = allFeatureItems.find((it) => it.id === fId)
      return found ? getOptionLabel(found, locale) : fId
    })
    .slice(0, 8)

  if (locale === 'ar') {
    const lines: string[] = []
    lines.push(
      `فرصة استثمارية وسكنية مميزة للتنازل واستكمال الأقساط${project ? ` في مشروع (${project})` : ''}${developer ? ` من تطوير شركة ${developer}` : ''} بموقع حيوي في ${areaName}${street ? ` — شارع ${street}` : ''}.`
    )

    const specParts: string[] = []
    if (size) specParts.push(`المساحة الإجمالية ${size} م²`)
    if (rooms) specParts.push(`تتكون من ${rooms} غرف`)
    if (bedrooms) specParts.push(`منها ${bedrooms} غرف نوم`)
    if (bathrooms) specParts.push(`${bathrooms} حمام`)
    if (floor)
      specParts.push(
        `الطابق ${floor}${totalFloors ? ` من أصل ${totalFloors} طوابق` : ''}`
      )
    if (conditionLabel) specParts.push(`حالة التشطيب: ${conditionLabel}`)

    if (specParts.length > 0) {
      lines.push(`📐 مواصفات الوحدة: ${specParts.join(' ، ')}.`)
    }

    lines.push(
      `🏗 حالة الاستلام: ${isUnderConst ? `قيد الإنشاء (موعد التسليم المتوقع عام ${deliveryYear})` : 'جاهزة للاستلام الفوري'}.`
    )

    if (contractPriceNum > 0 || paidAmountNum > 0) {
      const finParts: string[] = []
      if (contractPriceNum > 0)
        finParts.push(
          `إجمالي سعر العقد الأصلي $${contractPriceNum.toLocaleString('en-US')}`
        )
      if (paidAmountNum > 0)
        finParts.push(
          `المبلغ المدفوع المطلوب للتنازل (الكاش) $${paidAmountNum.toLocaleString('en-US')}`
        )
      if (remainingAmount > 0)
        finParts.push(
          `المتبقي للمطور $${remainingAmount.toLocaleString('en-US')}`
        )
      if (installmentNum > 0)
        finParts.push(
          `بقسط دوري $${installmentNum.toLocaleString('en-US')}${remainingMonthsNum > 0 ? ` لمدة ${remainingMonthsNum} شهر` : ''}`
        )
      lines.push(`💰 التفاصيل المالية: ${finParts.join(' — ')}.`)
    }

    if (selectedFeatureLabels.length > 0) {
      lines.push(
        `✨ أبرز المميزات والخدمات: ${selectedFeatureLabels.join(' ، ')}.`
      )
    }

    lines.push(
      `✅ جميع عقود وإيصالات السداد الرسمية جاهزة لنقل الملكية مباشرة عبر المنصة بعمولة 0% على البائع.`
    )
    return lines.join('\n\n')
  }

  if (locale === 'ru') {
    const lines: string[] = []
    lines.push(
      `Отличное предложение по переуступке рассрочки${project ? ` в ЖК «${project}»` : ''}${developer ? ` от застройщика ${developer}` : ''}, расположенном в районе ${areaName}${street ? `, ул. ${street}` : ''}.`
    )
    const specParts: string[] = []
    if (size) specParts.push(`общая площадь ${size} м²`)
    if (rooms) specParts.push(`комнат: ${rooms}`)
    if (bedrooms) specParts.push(`спален: ${bedrooms}`)
    if (floor)
      specParts.push(
        `этаж ${floor}${totalFloors ? ` из ${totalFloors}` : ''}`
      )
    if (conditionLabel) specParts.push(`состояние: ${conditionLabel}`)
    if (specParts.length > 0) {
      lines.push(`📐 Характеристики: ${specParts.join(', ')}.`)
    }
    if (contractPriceNum > 0 || paidAmountNum > 0) {
      lines.push(
        `💰 Финансовые условия: полная цена по договору $${contractPriceNum.toLocaleString('en-US')}, выплаченная сумма (на руки) $${paidAmountNum.toLocaleString('en-US')}${installmentNum > 0 ? `, платеж по рассрочке $${installmentNum.toLocaleString('en-US')}` : ''}${remainingMonthsNum > 0 ? ` (${remainingMonthsNum} мес.)` : ''}.`
      )
    }
    if (selectedFeatureLabels.length > 0) {
      lines.push(`✨ Удобства: ${selectedFeatureLabels.join(', ')}.`)
    }
    return lines.join('\n\n')
  }

  if (locale === 'ka') {
    const lines: string[] = []
    lines.push(
      `იყიდება ქონება განვადების გადაბარებით${project ? ` პროექტში «${project}»` : ''}${developer ? ` (${developer})` : ''}, მდებარეობა: ${areaName}${street ? `, ${street}` : ''}.`
    )
    const specParts: string[] = []
    if (size) specParts.push(`ფართობი ${size} მ²`)
    if (rooms) specParts.push(`ოთახები: ${rooms}`)
    if (bedrooms) specParts.push(`საძინებელი: ${bedrooms}`)
    if (floor)
      specParts.push(
        `სართული ${floor}${totalFloors ? `/${totalFloors}` : ''}`
      )
    if (specParts.length > 0) {
      lines.push(`📐 მახასიათებლები: ${specParts.join(', ')}.`)
    }
    if (contractPriceNum > 0 || paidAmountNum > 0) {
      lines.push(
        `💰 ფინანსური პირობები: კონტრაქტის სრული ფასი $${contractPriceNum.toLocaleString('en-US')}, გადახდილი თანხა (ხელზე) $${paidAmountNum.toLocaleString('en-US')}.`
      )
    }
    return lines.join('\n\n')
  }

  const lines: string[] = []
  lines.push(
    `Prime installment assignment opportunity${project ? ` in "${project}"` : ''}${developer ? ` by ${developer}` : ''}, located in ${areaName}${street ? `, ${street}` : ''}.`
  )
  const specParts: string[] = []
  if (size) specParts.push(`${size} m² total area`)
  if (rooms) specParts.push(`${rooms} rooms`)
  if (bedrooms) specParts.push(`${bedrooms} bedroom(s)`)
  if (bathrooms) specParts.push(`${bathrooms} bathroom(s)`)
  if (floor)
    specParts.push(
      `floor ${floor}${totalFloors ? ` of ${totalFloors}` : ''}`
    )
  if (conditionLabel) specParts.push(`condition: ${conditionLabel}`)
  if (specParts.length > 0) {
    lines.push(`📐 Specifications: ${specParts.join(', ')}.`)
  }
  lines.push(
    `🏗 Handover Status: ${isUnderConst ? `Under construction (Expected delivery ${deliveryYear})` : 'Ready for immediate handover'}.`
  )
  if (contractPriceNum > 0 || paidAmountNum > 0) {
    lines.push(
      `💰 Financial Terms: Total contract price $${contractPriceNum.toLocaleString('en-US')} — Paid cash required $${paidAmountNum.toLocaleString('en-US')}${remainingAmount > 0 ? ` — Remaining balance $${remainingAmount.toLocaleString('en-US')}` : ''}${installmentNum > 0 ? ` ($${installmentNum.toLocaleString('en-US')} installment${remainingMonthsNum > 0 ? ` for ${remainingMonthsNum} months` : ''})` : ''}.`
    )
  }
  if (selectedFeatureLabels.length > 0) {
    lines.push(`✨ Key Features: ${selectedFeatureLabels.join(', ')}.`)
  }
  return lines.join('\n\n')
}