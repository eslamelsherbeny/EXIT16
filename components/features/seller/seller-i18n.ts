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
    addByUrlBtn: string
    videoSectionTitle: string
    videoSectionSubtitle: string
    uploadVideoBoxTitle: string
    uploadVideoBoxSub: string
    videoUrlLabel: string
    tour3dLabel: string
  }
  locationSection: {
    title: string
    subtitleRent: string
    subtitleSale: string
    cityDistrictLabel: string
    chooseLocationPlaceholder: string
    developerLabel: string
    projectLabel: string
    streetLabel: string
    houseNoLabel: string
    cadastralLabel: string
    cadastralHelper: string
    mapHeaderTitle: string
    mapHint: string
  }
  locationModal: {
    title: string
    searchPlaceholder: string
    nearbyTitle: string
    nearbySub: string
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
    bedroomsLabel: string
    roomsLabel: string
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
    rentDailyLabel: string
    rentMonthlyLabel: string
    negotiableLabel: string
    exchangePossibleLabel: string
    exclusiveTitle: string
    exclusiveSub: string
    discountAmountLabel: string
    districtGuideTitle: string
    districtGuideSub: string
    descriptionLabel: string
    aiDescriptionBtn: string
    descriptionPlaceholder: string
    docsBoxTitle: string
    docContract: string
    docReceipts: string
    docStatement: string
    docPassport: string
    changeBtn: string
    uploadBtn: string
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
    pageTitle: 'إضافة إعلان عقاري',
    pageSubtitle: 'صفحة واحدة ذكية — املأ التفاصيل وانشر إعلانك فوراً.',
    tabs: {
      type: '1 نوع الإعلان',
      photos: '2 الصور',
      location: '3 الموقع',
      details: '4 المواصفات',
      price: '5 السعر والوصف',
      contact: '6 التواصل',
    },
    typeSection: {
      title: 'نوع الإعلان والعقار',
      subtitle: 'اختر نوع العملية أولاً ثم نوع العقار — يتكيف باقي النموذج تلقائياً حسب اختيارك.',
      whatToDoLabel: 'ماذا تريد أن تفعل بعقارك؟',
      whatKindLabel: 'ما هو نوع العقار؟',
      statusLabel: 'حالة البناء *',
    },
    photosSection: {
      title: 'الصور والفيديو',
      subtitle: 'أظهر التصميم الداخلي والخارجي: غرفة المعيشة، غرف النوم، الحمامات، الشرفة، والإطلالة.',
      dropTitle: 'أضف الصور أو اسحبها هنا',
      photosWord: 'صورة',
      dropHint: 'الإعلانات بدون صور تحصل على اهتمام أقل. الصورة الأولى تصبح صورة الغلاف.',
      uploading: 'جاري رفع الصور...',
      coverBadge: 'صورة الغلاف',
      addByUrlBtn: 'إضافة صورة برابط',
      videoSectionTitle: 'الفيديو',
      videoSectionSubtitle: 'الفيديو القصير يرفع التفاعل بشكل كبير — ارفع ملفاً أو ضع رابط يوتيوب.',
      uploadVideoBoxTitle: 'ارفع فيديو أو اسحبه هنا',
      uploadVideoBoxSub: 'MP4, WebM, MOV · بحد أقصى 100MB',
      videoUrlLabel: 'أو ضع رابط يوتيوب / فيميو',
      tour3dLabel: 'رابط جولة ثلاثية الأبعاد',
    },
    locationSection: {
      title: 'الموقع والعنوان',
      subtitleRent: 'أدخل اسم الشارع ورقم المبنى — يظهر الدبوس على الخريطة تلقائياً.',
      subtitleSale: 'اختر المدينة والحي — نعرض الموقع التقريبي للمشترين لحماية خصوصيتك.',
      cityDistrictLabel: 'المدينة / الحي *',
      chooseLocationPlaceholder: 'اختر الموقع',
      developerLabel: 'اسم المطور العقاري',
      projectLabel: 'اسم المشروع أو المجمع',
      streetLabel: 'الشارع',
      houseNoLabel: 'رقم المبنى',
      cadastralLabel: 'الرقم العقاري الحكومي',
      cadastralHelper: 'اختياري — يربط قطعة الأرض بالسجل العقاري الجورجي على الخريطة',
      mapHeaderTitle: 'خريطة الموقع ثلاثية الأبعاد',
      mapHint: 'اسحب الدبوس أو اضغط على الخريطة لتأكيد الموقع',
    },
    locationModal: {
      title: 'الموقع',
      searchPlaceholder: 'ابحث عن الحي، المدينة، المنطقة أو الشارع...',
      nearbyTitle: 'بالقرب مني',
      nearbySub: 'تحديد المدينة من موقعك الحالي',
      popularCitiesTitle: 'المدن الأكثر طلباً',
      municipalitiesTitle: 'البلديات والمحافظات',
      districtsTab: 'الأحياء والشوارع',
      wholeCityBtn: 'المدينة بالكامل',
      clearBtn: 'مسح',
      selectBtn: 'اختيار',
    },
    detailsSection: {
      title: 'المواصفات والمميزات',
      subtitle: 'أدخل عدد الغرف والمساحة والطابق والمميزات بدقة.',
      lockedBanner: 'اختر نوع العملية ونوع العقار بالأعلى لفتح حقول المواصفات.',
      conditionLabel: 'حالة التشطيب',
      buildingSeriesLabel: 'طراز المبنى',
      buildingSeriesSub: 'يساعد المشترين على الفلترة السريعة',
      floorTypeLabel: 'نوع الطابق',
      heatingLabel: 'نظام التدفئة',
      buildingMaterialLabel: 'مادة البناء',
      areaLabel: 'المساحة الإجمالية (م²) *',
      kitchenAreaLabel: 'مساحة المطبخ (م²)',
      yearBuiltLabel: 'سنة البناء',
      balconyAreaLabel: 'مساحة الشرفة (م²)',
      loggiaAreaLabel: 'مساحة اللوجيا (م²)',
      terraceAreaLabel: 'مساحة التراس / الحديقة (م²)',
      bedroomsLabel: 'غرف النوم *',
      roomsLabel: 'إجمالي الغرف *',
      bathroomsLabel: 'الحمامات',
      floorLabel: 'الطابق',
      totalFloorsLabel: 'إجمالي طوابق المبنى',
      maxGuestsLabel: 'أقصى عدد للضيوف',
      featuresTitle: 'المميزات والتجهيزات',
      featuresSubtitle: 'اختر المميزات المتوفرة فعلياً في العقار.',
      onlineViewingTitle: 'أنا مستعد للمعاينة أونلاين بالفيديو',
      onlineViewingSub: 'إذا كان بإمكانك عرض العقار عن بُعد عبر واتساب أو زووم، فعّل هذا الخيار.',
      installmentSaleTitle: 'متاح البيع بالتقسيط على دفعات',
      installmentSaleSub: 'فعّل هذا الخيار إذا كنت تقبل سداد السعر على دفعات.',
    },
    pricingSection: {
      title: 'السعر والوصف',
      subtitle: 'حدد سعراً واقعياً أو اختر قابل للتفاوض.',
      priceLabel: 'السعر *',
      totalPriceBtn: 'السعر الإجمالي',
      perSqmBtn: 'سعر المتر',
      contractPriceLabel: 'إجمالي سعر العقد *',
      paidAmountLabel: 'المبلغ المدفوع (الكاش المطلوب) *',
      marketPriceLabel: 'سعر السوق اليوم',
      installmentAmountLabel: 'قيمة القسط الدوري',
      remainingMonthsLabel: 'الأقساط المتبقية (بالشهور)',
      contractDateLabel: 'تاريخ التعاقد الأصلي',
      rentDailyLabel: 'سعر الليلة الواحدة *',
      rentMonthlyLabel: 'سعر الإيجار الشهري *',
      negotiableLabel: 'السعر قابل للتفاوض',
      exchangePossibleLabel: 'متاح البدل بعقار آخر',
      exclusiveTitle: 'حصري على المنصة',
      exclusiveSub: 'هذا الإعلان منشور حصرياً هنا فقط',
      discountAmountLabel: 'قيمة الخصم المسموح به للتفاوض (اختياري)',
      districtGuideTitle: 'مرشد أسعار المنطقة',
      districtGuideSub: 'متوسط سعر المتر السكني في هذه المنطقة يتراوح بين $1,150 و $1,650 حسب التشطيب.',
      descriptionLabel: 'الوصف',
      aiDescriptionBtn: 'كتابة بالذكاء الاصطناعي',
      descriptionPlaceholder: 'اشرح مميزات العقار باختصار — أبرز نقاط القوة...',
      docsBoxTitle: 'مستندات الملكية والتنازل (اختياري الآن)',
      docContract: 'عقد الشراء',
      docReceipts: 'إيصالات السداد',
      docStatement: 'كشف الحساب',
      docPassport: 'جواز السفر',
      changeBtn: 'تغيير',
      uploadBtn: 'ارفع',
    },
    previewSidebar: {
      title: 'معاينة حية للإعلان',
      subtitle: 'هكذا سيظهر إعلانك أمام المشترين',
      emptyPhotoTitle: 'مطلوب صورة واحدة على الأقل',
      emptyPhotoSub: 'ارفع صورة — ستظهر معاينة إعلانك هنا مباشرة',
      priceOnRequest: 'السعر عند الإدخال',
      perDay: ' / يومياً',
      perMonth: ' / شهرياً',
      cashRequiredSuffix: ' (الكاش المطلوب)',
      bedsShort: 'غرف نوم',
      strengthTitle: 'قوة الإعلان',
      strengthGreat: 'إعلان ممتاز ومكتمل — جاهز لأعلى ظهور!',
      strengthGood: 'بداية جيدة — أضف المزيد من التفاصيل',
      tipPhotos: 'أضف 10 صور واضحة للعقار',
      tipLocation: 'حدد الموقع الدقيق والعنوان',
      tipDetails: 'أكمل مواصفات ومساحة العقار',
      tipDescription: 'اكتب وصفاً كاملاً للعقار',
    },
    bottomBar: {
      savedAtPrefix: 'تم حفظ المسودة الساعة',
      autoSavedPrefix: 'حفظ تلقائي للمسودة',
      saveDraftBtn: 'حفظ كمسودة',
      publishingBtn: 'جاري النشر...',
      publishBtn: 'نشر الإعلان',
    },
  },
  en: {
    pageTitle: 'Add a listing',
    pageSubtitle: 'One page — fill in and publish.',
    tabs: {
      type: '1 Type',
      photos: '2 Photos',
      location: '3 Location',
      details: '4 Details',
      price: '5 Price & description',
      contact: '6 Contact',
    },
    typeSection: {
      title: 'Type',
      subtitle: 'Pick sale or rent first, then the property type — we tailor the rest of the form.',
      whatToDoLabel: 'What do you want to do?',
      whatKindLabel: 'What kind of property?',
      statusLabel: 'Status *',
    },
    photosSection: {
      title: 'Photos',
      subtitle: 'Show interior and exterior: living room, bedroom, bathrooms, balcony, view.',
      dropTitle: 'Add photos or drag them here',
      photosWord: 'photos',
      dropHint: 'Listings without photos get less interest. The first shot is the cover.',
      uploading: 'Uploading photos...',
      coverBadge: 'Cover photo',
      addByUrlBtn: 'Add photo by URL',
      videoSectionTitle: 'Video',
      videoSectionSubtitle: 'Short video boosts engagement — upload a file or paste a YouTube link.',
      uploadVideoBoxTitle: 'Upload a video or drag here',
      uploadVideoBoxSub: 'MP4, WebM, MOV · up to 100MB',
      videoUrlLabel: 'Or paste a YouTube / Vimeo link',
      tour3dLabel: '3D tour link',
    },
    locationSection: {
      title: 'Location',
      subtitleRent: 'Enter the exact street and house number — the pin drops on the map automatically.',
      subtitleSale: 'Enter the district and street — the pin drops on the map automatically.',
      cityDistrictLabel: 'City / District *',
      chooseLocationPlaceholder: 'Choose location',
      developerLabel: 'Developer name',
      projectLabel: 'Project / Complex name',
      streetLabel: 'Street',
      houseNoLabel: 'House Nº',
      cadastralLabel: 'Cadastral code',
      cadastralHelper: 'Optional — snaps NAPR parcel onto the map',
      mapHeaderTitle: 'Interactive 3D Map',
      mapHint: 'Click on the map or drag to adjust view',
    },
    locationModal: {
      title: 'Location',
      searchPlaceholder: 'District, city, neighborhood or street',
      nearbyTitle: 'Nearby',
      nearbySub: 'City from this place',
      popularCitiesTitle: 'POPULAR CITIES',
      municipalitiesTitle: 'MUNICIPALITIES',
      districtsTab: 'Districts',
      wholeCityBtn: 'Whole city',
      clearBtn: 'Clear',
      selectBtn: 'Select',
    },
    detailsSection: {
      title: 'Details',
      subtitle: 'Fill in accurate rooms, area, floor, status and features.',
      lockedBanner: 'Choose a deal type and property type above to unlock the fields.',
      conditionLabel: 'Condition',
      buildingSeriesLabel: 'Building series',
      buildingSeriesSub: 'For older blocks — helps buyers filter fast',
      floorTypeLabel: 'Floor type',
      heatingLabel: 'Heating',
      buildingMaterialLabel: 'Building material',
      areaLabel: 'Area (m²) *',
      kitchenAreaLabel: 'Kitchen area (m²)',
      yearBuiltLabel: 'Year built',
      balconyAreaLabel: 'Balcony (m²)',
      loggiaAreaLabel: 'Loggia (m²)',
      terraceAreaLabel: 'Terrace (m²)',
      bedroomsLabel: 'Bedrooms *',
      roomsLabel: 'Rooms *',
      bathroomsLabel: 'Bathrooms',
      floorLabel: 'Floor',
      totalFloorsLabel: 'Total floors',
      maxGuestsLabel: 'Max guests',
      featuresTitle: 'Features',
      featuresSubtitle: 'Select only what the property actually has.',
      onlineViewingTitle: 'I am ready for online viewings',
      onlineViewingSub: 'If you can show the property remotely (Viber, WhatsApp, Zoom), check this box.',
      installmentSaleTitle: 'Installment sale possible',
      installmentSaleSub: 'Check if you accept the price paid in parts over time.',
    },
    pricingSection: {
      title: 'Price & description',
      subtitle: 'Set a realistic price or mark negotiable.',
      priceLabel: 'Price *',
      totalPriceBtn: 'Total price',
      perSqmBtn: 'Price per m²',
      contractPriceLabel: 'Total contract price *',
      paidAmountLabel: 'Paid amount (Required cash) *',
      marketPriceLabel: 'Current market price',
      installmentAmountLabel: 'Installment amount',
      remainingMonthsLabel: 'Remaining months',
      contractDateLabel: 'Original contract date',
      rentDailyLabel: 'Daily rent price *',
      rentMonthlyLabel: 'Monthly rent price *',
      negotiableLabel: 'Price negotiable',
      exchangePossibleLabel: 'Exchange possible',
      exclusiveTitle: 'Exclusive',
      exclusiveSub: 'Only published on this platform',
      discountAmountLabel: 'Max negotiable discount amount (Optional)',
      districtGuideTitle: 'District price guide',
      districtGuideSub: 'Average market range in this district is $1,150 – $1,650 / m².',
      descriptionLabel: 'Description',
      aiDescriptionBtn: 'AI description',
      descriptionPlaceholder: 'Describe the property briefly — highlight the advantages...',
      docsBoxTitle: 'Ownership Documents (Optional now)',
      docContract: 'Unit Contract',
      docReceipts: 'Payment Receipts',
      docStatement: 'Account Statement',
      docPassport: 'Passport',
      changeBtn: 'Change',
      uploadBtn: 'Upload',
    },
    previewSidebar: {
      title: 'Live preview',
      subtitle: 'This is how buyers will see your listing',
      emptyPhotoTitle: 'At least 1 photo is required',
      emptyPhotoSub: 'Upload a photo — your listing preview appears here',
      priceOnRequest: 'Price on request',
      perDay: ' /day',
      perMonth: ' /month',
      cashRequiredSuffix: ' (Cash Required)',
      bedsShort: 'Beds',
      strengthTitle: 'Listing strength',
      strengthGreat: 'Great listing strength — ready for maximum visibility!',
      strengthGood: 'Good start — add more detail',
      tipPhotos: 'Add 10 more photos',
      tipLocation: 'Pin the exact location and address',
      tipDetails: 'Fill in the property details',
      tipDescription: 'Write a fuller description',
    },
    bottomBar: {
      savedAtPrefix: 'Draft saved at',
      autoSavedPrefix: 'Draft saved automatically',
      saveDraftBtn: 'Save draft',
      publishingBtn: 'Publishing...',
      publishBtn: 'Publish',
    },
  },
  ru: {
    pageTitle: 'Добавить объявление',
    pageSubtitle: 'Одна страница — заполните детали и опубликуйте.',
    tabs: {
      type: '1 Тип',
      photos: '2 Фото',
      location: '3 Локация',
      details: '4 Детали',
      price: '5 Цена и описание',
      contact: '6 Контакты',
    },
    typeSection: {
      title: 'Тип сделки и объекта',
      subtitle: 'Сначала выберите тип сделки, затем тип недвижимости.',
      whatToDoLabel: 'Что вы хотите сделать?',
      whatKindLabel: 'Какой тип недвижимости?',
      statusLabel: 'Статус *',
    },
    photosSection: {
      title: 'Фотографии',
      subtitle: 'Покажите интерьер и экстерьер: гостиную, спальни, ванную, балкон и вид.',
      dropTitle: 'Добавьте фото или перетащите их сюда',
      photosWord: 'фото',
      dropHint: 'Первое фото станет обложкой объявления.',
      uploading: 'Загрузка фото...',
      coverBadge: 'Обложка',
      addByUrlBtn: 'Добавить фото по ссылке',
      videoSectionTitle: 'Видео',
      videoSectionSubtitle: 'Короткое видео повышает интерес — загрузите файл или вставьте ссылку на YouTube.',
      uploadVideoBoxTitle: 'Загрузите видео или перетащите сюда',
      uploadVideoBoxSub: 'MP4, WebM, MOV · до 100MB',
      videoUrlLabel: 'Или вставьте ссылку YouTube / Vimeo',
      tour3dLabel: 'Ссылка на 3D-тур',
    },
    locationSection: {
      title: 'Местоположение',
      subtitleRent: 'Укажите улицу и номер дома — пин появится на карте автоматически.',
      subtitleSale: 'Выберите город и район — пин появится на карте автоматически.',
      cityDistrictLabel: 'Город / Район *',
      chooseLocationPlaceholder: 'Выберите локацию',
      developerLabel: 'Застройщик',
      projectLabel: 'Название ЖК / Проекта',
      streetLabel: 'Улица',
      houseNoLabel: 'Дом Nº',
      cadastralLabel: 'Кадастровый код',
      cadastralHelper: 'Необязательно — привязка участка NAPR к карте',
      mapHeaderTitle: 'Интерактивная 3D-карта',
      mapHint: 'Проверьте расположение объекта на карте',
    },
    locationModal: {
      title: 'Локация',
      searchPlaceholder: 'Район, город, микрорайон или улица',
      nearbyTitle: 'Рядом со мной',
      nearbySub: 'Определить город по геолокации',
      popularCitiesTitle: 'ПОПУЛЯРНЫЕ ГОРОДА',
      municipalitiesTitle: 'МУНИЦИПАЛИТЕТЫ',
      districtsTab: 'Районы',
      wholeCityBtn: 'Весь город',
      clearBtn: 'Сбросить',
      selectBtn: 'Выбрать',
    },
    detailsSection: {
      title: 'Характеристики',
      subtitle: 'Укажите площадь, комнаты, этаж, состояние и удобства.',
      lockedBanner: 'Выберите тип сделки и тип объекта выше, чтобы открыть поля.',
      conditionLabel: 'Состояние / Ремонт',
      buildingSeriesLabel: 'Серия дома',
      buildingSeriesSub: 'Помогает покупателям быстрее находить объект',
      floorTypeLabel: 'Тип этажа',
      heatingLabel: 'Отопление',
      buildingMaterialLabel: 'Материал здания',
      areaLabel: 'Общая площадь (м²) *',
      kitchenAreaLabel: 'Площадь кухни (м²)',
      yearBuiltLabel: 'Год постройки',
      balconyAreaLabel: 'Балкон (м²)',
      loggiaAreaLabel: 'Лоджия (м²)',
      terraceAreaLabel: 'Терраса (м²)',
      bedroomsLabel: 'Спальни *',
      roomsLabel: 'Комнаты *',
      bathroomsLabel: 'Санузлы',
      floorLabel: 'Этаж',
      totalFloorsLabel: 'Всего этажей',
      maxGuestsLabel: 'Макс. гостей',
      featuresTitle: 'Удобства и особенности',
      featuresSubtitle: 'Отметьте всё, что есть в объекте.',
      onlineViewingTitle: 'Готов к онлайн-показу',
      onlineViewingSub: 'Отметьте, если можете показать объект по видеосвязи (WhatsApp, Viber, Zoom).',
      installmentSaleTitle: 'Возможна продажа в рассрочку',
      installmentSaleSub: 'Отметьте, если готовы принимать оплату частями.',
    },
    pricingSection: {
      title: 'Цена и описание',
      subtitle: 'Укажите реальную цену или отметьте возможность торга.',
      priceLabel: 'Цена *',
      totalPriceBtn: 'Общая цена',
      perSqmBtn: 'Цена за м²',
      contractPriceLabel: 'Полная цена по договору *',
      paidAmountLabel: 'Выплачено (Сумма на руки) *',
      marketPriceLabel: 'Рыночная цена сегодня',
      installmentAmountLabel: 'Платеж по рассрочке',
      remainingMonthsLabel: 'Осталось месяцев',
      contractDateLabel: 'Дата договора',
      rentDailyLabel: 'Цена за сутки *',
      rentMonthlyLabel: 'Цена в месяц *',
      negotiableLabel: 'Торг уместен',
      exchangePossibleLabel: 'Возможен обмен',
      exclusiveTitle: 'Эксклюзив',
      exclusiveSub: 'Опубликовано только на этой платформе',
      discountAmountLabel: 'Сумма возможной скидки (Необязательно)',
      districtGuideTitle: 'Ориентир цен в районе',
      districtGuideSub: 'Средний диапазон цен в этом районе: $1,150 – $1,650 / м².',
      descriptionLabel: 'Описание',
      aiDescriptionBtn: 'AI описание',
      descriptionPlaceholder: 'Опишите объект кратко — выделите главные плюсы...',
      docsBoxTitle: 'Документы на недвижимость (Необязательно сейчас)',
      docContract: 'Договор купли',
      docReceipts: 'Квитанции оплаты',
      docStatement: 'Выписка со счета',
      docPassport: 'Паспорт',
      changeBtn: 'Заменить',
      uploadBtn: 'Загрузить',
    },
    previewSidebar: {
      title: 'Предпросмотр',
      subtitle: 'Так покупатели увидят ваше объявление',
      emptyPhotoTitle: 'Нужно хотя бы 1 фото',
      emptyPhotoSub: 'Загрузите фото — предпросмотр появится здесь',
      priceOnRequest: 'Цена по запросу',
      perDay: ' /сут.',
      perMonth: ' /мес.',
      cashRequiredSuffix: ' (На руки)',
      bedsShort: 'спальни',
      strengthTitle: 'Качество объявления',
      strengthGreat: 'Отличное заполнение — готово к публикации!',
      strengthGood: 'Хорошее начало — добавьте деталей',
      tipPhotos: 'Добавьте еще 10 фотографий',
      tipLocation: 'Укажите точный адрес и локацию',
      tipDetails: 'Заполните характеристики объекта',
      tipDescription: 'Напишите подробное описание',
    },
    bottomBar: {
      savedAtPrefix: 'Черновик сохранен в',
      autoSavedPrefix: 'Черновик сохранен автоматически',
      saveDraftBtn: 'Сохранить черновик',
      publishingBtn: 'Публикация...',
      publishBtn: 'Опубликовать',
    },
  },
  ka: {
    pageTitle: 'განცხადების დამატება',
    pageSubtitle: 'ერთი გვერდი — შეავსეთ და გამოაქვეყნეთ.',
    tabs: {
      type: '1 ტიპი',
      photos: '2 ფოტოები',
      location: '3 მდებარეობა',
      details: '4 დეტალები',
      price: '5 ფასი და აღწერა',
      contact: '6 კონტაქტი',
    },
    typeSection: {
      title: 'გარიგების და ქონების ტიპი',
      subtitle: 'ჯერ აირჩიეთ გარიგების ტიპი, შემდეგ კი ქონების სახეობა.',
      whatToDoLabel: 'რისი გაკეთება გსურთ?',
      whatKindLabel: 'რა ტიპის ქონებაა?',
      statusLabel: 'სტატუსი *',
    },
    photosSection: {
      title: 'ფოტოები',
      subtitle: 'აჩვენეთ ინტერიერი და ექსტერიერი: მისაღები, საძინებელი, აივანი და ხედი.',
      dropTitle: 'დაამატეთ ფოტოები ან გადმოიტანეთ აქ',
      photosWord: 'ფოტო',
      dropHint: 'პირველი ფოტო გახდება განცხადების მთავარი სურათი.',
      uploading: 'ფოტოები იტვირთება...',
      coverBadge: 'მთავარი ფოტო',
      addByUrlBtn: 'ფოტოს დამატება ბმულით',
      videoSectionTitle: 'ვიდეო',
      videoSectionSubtitle: 'მოკლე ვიდეო ზრდის ინტერესს — ატვირთეთ ფაილი ან ჩასვით YouTube ბმული.',
      uploadVideoBoxTitle: 'ატვირთეთ ვიდეო ან გადმოიტანეთ აქ',
      uploadVideoBoxSub: 'MP4, WebM, MOV · მაქს. 100MB',
      videoUrlLabel: 'ან ჩასვით YouTube / Vimeo ბმული',
      tour3dLabel: '3D ტურის ბმული',
    },
    locationSection: {
      title: 'მდებარეობა',
      subtitleRent: 'შეიყვანეთ ქუჩა და სახლის ნომერი — პინი რუკაზე ავტომატურად გამოჩნდება.',
      subtitleSale: 'აირჩიეთ ქალაქი და უბანი — პინი რუკაზე ავტომატურად გამოჩნდება.',
      cityDistrictLabel: 'ქალაქი / უბანი *',
      chooseLocationPlaceholder: 'აირჩიეთ მდებარეობა',
      developerLabel: 'დეველოპერი',
      projectLabel: 'პროექტის / კომპლექსის სახელი',
      streetLabel: 'ქუჩა',
      houseNoLabel: 'სახლის Nº',
      cadastralLabel: 'საკადასტრო კოდი',
      cadastralHelper: 'არასავალდებულო — საჯარო რეესტრის ნაკვეთის რუკაზე მიბმა',
      mapHeaderTitle: 'ინტერაქტიული 3D რუკა',
      mapHint: 'შეამოწმეთ მდებარეობა რუკაზე',
    },
    locationModal: {
      title: 'მდებარეობა',
      searchPlaceholder: 'უბანი, ქალაქი ან ქუჩა',
      nearbyTitle: 'ჩემთან ახლოს',
      nearbySub: 'ქალაქის განსაზღვრა მდებარეობით',
      popularCitiesTitle: 'პოპულარული ქალაქები',
      municipalitiesTitle: 'მუნიციპალიტეტები',
      districtsTab: 'უბნები',
      wholeCityBtn: 'მთელი ქალაქი',
      clearBtn: 'გასუფთავება',
      selectBtn: 'არჩევა',
    },
    detailsSection: {
      title: 'დეტალები',
      subtitle: 'შეავსეთ ოთახების რაოდენობა, ფართობი, სართული და მახასიათებლები.',
      lockedBanner: 'ველების გასახსნელად ზემოთ აირჩიეთ გარიგებისა და ქონების ტიპი.',
      conditionLabel: 'მდგომარეობა',
      buildingSeriesLabel: 'შენობის პროექტი',
      buildingSeriesSub: 'ეხმარება მყიდველებს სწრაფ ფილტრაციაში',
      floorTypeLabel: 'სართულის ტიპი',
      heatingLabel: 'გათბობა',
      buildingMaterialLabel: 'სამშენებლო მასალა',
      areaLabel: 'საერთო ფართი (მ²) *',
      kitchenAreaLabel: 'სამზარეულოს ფართი (მ²)',
      yearBuiltLabel: 'აშენების წელი',
      balconyAreaLabel: 'აივანი (მ²)',
      loggiaAreaLabel: 'ლოჯია (მ²)',
      terraceAreaLabel: 'ტერასა (მ²)',
      bedroomsLabel: 'საძინებლები *',
      roomsLabel: 'ოთახები *',
      bathroomsLabel: 'სველი წერტილები',
      floorLabel: 'სართული',
      totalFloorsLabel: 'სართულები სულ',
      maxGuestsLabel: 'სტუმრების მაქს. რაოდენობა',
      featuresTitle: 'მახასიათებლები',
      featuresSubtitle: 'მონიშნეთ მხოლოდ ის, რაც რეალურად არის ქონებაში.',
      onlineViewingTitle: 'მზად ვარ ონლაინ ჩვენებისთვის',
      onlineViewingSub: 'მონიშნეთ, თუ შეგიძლიათ ქონების დისტანციურად ჩვენება (WhatsApp, Viber, Zoom).',
      installmentSaleTitle: 'შესაძლებელია შიდა განვადება',
      installmentSaleSub: 'მონიშნეთ, თუ თანახმა ხართ თანხის ნაწილ-ნაწილ გადახდაზე.',
    },
    pricingSection: {
      title: 'ფასი და აღწერა',
      subtitle: 'მიუთითეთ რეალური ფასი ან მონიშნეთ შეთანხმებით.',
      priceLabel: 'ფასი *',
      totalPriceBtn: 'სრული ფასი',
      perSqmBtn: 'ფასი მ²-ზე',
      contractPriceLabel: 'კონტრაქტის სრული ფასი *',
      paidAmountLabel: 'გადახდილი თანხა (ხელზე) *',
      marketPriceLabel: 'საბაზრო ფასი დღეს',
      installmentAmountLabel: 'განვადების შენატანი',
      remainingMonthsLabel: 'დარჩენილი თვეები',
      contractDateLabel: 'კონტრაქტის თარიღი',
      rentDailyLabel: 'დღიური ფასი *',
      rentMonthlyLabel: 'თვიური ქირის ფასი *',
      negotiableLabel: 'ფასი შეთანხმებით',
      exchangePossibleLabel: 'შესაძლებელია გაცვლა',
      exclusiveTitle: 'ექსკლუზივი',
      exclusiveSub: 'გამოქვეყნებულია მხოლოდ ამ პლატფორმაზე',
      discountAmountLabel: 'დასაშვები ფასდაკლება (არასავალდებულო)',
      districtGuideTitle: 'უბნის ფასების გზამკვლევი',
      districtGuideSub: 'საშუალო საბაზრო ფასი ამ უბანში შეადგენს $1,150 – $1,650 / მ²-ს.',
      descriptionLabel: 'აღწერა',
      aiDescriptionBtn: 'AI აღწერა',
      descriptionPlaceholder: 'მოკლედ აღწერეთ ქონება — გამოყავით მთავარი უპირატესობები...',
      docsBoxTitle: 'საკუთრების დოკუმენტები (არასავალდებულო ახლა)',
      docContract: 'ნასყიდობის კონტრაქტი',
      docReceipts: 'გადახდის ქვითრები',
      docStatement: 'ამონაწერი',
      docPassport: 'პასპორტი',
      changeBtn: 'შეცვლა',
      uploadBtn: 'ატვირთვა',
    },
    previewSidebar: {
      title: 'ცოცხალი გადახედვა',
      subtitle: 'ასე დაინახავენ მყიდველები თქვენს განცხადებას',
      emptyPhotoTitle: 'საჭიროა მინიმუმ 1 ფოტო',
      emptyPhotoSub: 'ატვირთეთ ფოტო — განცხადების გადახედვა აქ გამოჩნდება',
      priceOnRequest: 'ფასი შეთანხმებით',
      perDay: ' /დღე',
      perMonth: ' /თვე',
      cashRequiredSuffix: ' (საჭირო თანხა)',
      bedsShort: 'საძინებელი',
      strengthTitle: 'განცხადების სიძლიერე',
      strengthGreat: 'შესანიშნავი შევსება — მზადაა გამოსაქვეყნებლად!',
      strengthGood: 'კარგი დასაწყისია — დაამატეთ დეტალები',
      tipPhotos: 'დაამატეთ კიდევ 10 ფოტო',
      tipLocation: 'მიუთითეთ ზუსტი მდებარეობა და მისამართი',
      tipDetails: 'შეავსეთ ქონების მახასიათებლები',
      tipDescription: 'დაწერეთ სრული აღწერა',
    },
    bottomBar: {
      savedAtPrefix: 'მონახაზი შენახულია',
      autoSavedPrefix: 'ავტომატურად შენახულია',
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
  locale: LocaleCode = 'ar'
): SellerFormTranslations {
  return SELLER_FORM_TRANSLATIONS[locale] || SELLER_FORM_TRANSLATIONS.ar
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
  if (!clean || !clean.includes('@')) return 'es***@gmail.com'
  const [local, domain] = clean.split('@')
  return `${local.slice(0, 2)}***@${domain}`
}

export function isImageFileUrl(url?: string, name?: string): boolean {
  const target = `${url || ''} ${name || ''}`.toLowerCase()
  if (target.includes('.pdf')) return false
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)/i.test(target) || Boolean(url)
}