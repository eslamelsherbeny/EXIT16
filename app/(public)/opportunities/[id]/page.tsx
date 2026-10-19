'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Share2,
  Star,
  X,
  ZoomIn,
} from 'lucide-react'

// صورة احتياطية وحيدة في حال لم يرفع البائع أي صورة نهائياً
const FALLBACK_UNIT_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'

const defaultTags = [
  'حديقة خاصة',
  'فيو لاندسكيب',
  'ناصية',
  'قريبة من الخدمات',
  'جراج',
  'كلوب هاوس',
]

// بيانات الوحدات الافتراضية الثابتة
const staticUnitsMap: Record<string, any> = {
  koun: {
    id: 'koun',
    code: 'U-12497',
    project_name: 'كون - Koun',
    developer_name: 'مباني إدريس',
    area: 'رأس الحكمة',
    unit_type: 'بنتهاوس',
    size: 79,
    floor_number: 3,
    rooms: 2,
    bathrooms: 1,
    finishing: 'تشطيب كامل',
    delivery_status: 'تحت الإنشاء',
    contract_year: 2024,
    contract_price: 9429450,
    paid_amount: 2800000,
    market_price: 12000000,
    installment_amount: 560000,
    installment_frequency: 'نصف سنوي',
    years_left: 4,
    willing_to_discount: true,
    discount_amount: 140000,
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  madinaty: {
    id: 'madinaty',
    code: 'U-16557',
    project_name: 'مدينتي',
    developer_name: 'طلعت مصطفى',
    area: 'القاهرة الجديدة',
    unit_type: 'شقة',
    size: 108,
    floor_number: 2,
    rooms: 2,
    bathrooms: 2,
    finishing: 'تشطيب كامل',
    delivery_status: 'تحت الإنشاء',
    contract_year: 2023,
    contract_price: 9248280,
    paid_amount: 3450000,
    market_price: 10500000,
    installment_amount: 25895,
    installment_frequency: 'شهري',
    years_left: 5,
    willing_to_discount: true,
    discount_amount: 150000,
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'z-park': {
    id: 'z-park',
    code: 'U-19167',
    project_name: 'Z park PSR Towers Elsheikh zayed 6 October',
    developer_name: 'ORA developers',
    area: 'الشيخ زايد',
    unit_type: 'شقة',
    size: 164,
    floor_number: 4,
    rooms: 3,
    bathrooms: 3,
    finishing: 'تشطيب بالتكييفات',
    delivery_status: 'تحت الإنشاء',
    contract_year: 2023,
    contract_price: 13310700,
    paid_amount: 5740136,
    market_price: 23050000,
    installment_amount: 374265,
    installment_frequency: 'ربع سنوي',
    years_left: 4,
    willing_to_discount: true,
    discount_amount: 250000,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  marbay: {
    id: 'marbay',
    code: 'U-19951',
    project_name: 'Marbay',
    developer_name: 'المراسم',
    area: 'رأس الحكمة',
    unit_type: 'توين هاوس',
    size: 220,
    floor_number: 1,
    rooms: 4,
    bathrooms: 4,
    finishing: 'تشطيب كامل',
    delivery_status: 'تحت الإنشاء',
    contract_year: 2024,
    contract_price: 32000000,
    paid_amount: 10200000,
    market_price: 35000000,
    installment_amount: 636000,
    installment_frequency: 'ربع سنوي',
    years_left: 5,
    willing_to_discount: true,
    discount_amount: 400000,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  tawny: {
    id: 'tawny',
    code: 'U-19950',
    project_name: 'تاوني 6 اكتوبر',
    developer_name: 'هايد بارك',
    area: '6 أكتوبر',
    unit_type: 'فيلا',
    size: 288,
    floor_number: 1,
    rooms: 4,
    bathrooms: 4,
    finishing: 'نصف تشطيب',
    delivery_status: 'تحت الإنشاء',
    contract_year: 2023,
    contract_price: 49300000,
    paid_amount: 17500000,
    market_price: 60000000,
    installment_amount: 1020000,
    installment_frequency: 'ربع سنوي',
    years_left: 5,
    willing_to_discount: true,
    discount_amount: 500000,
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'south-med': {
    id: 'south-med',
    code: 'U-19949',
    project_name: 'ساوث ميد',
    developer_name: 'طلعت مصطفى',
    area: 'الساحل الشمالي',
    unit_type: 'شقة',
    size: 90,
    floor_number: 2,
    rooms: 2,
    bathrooms: 2,
    finishing: 'تشطيب كامل',
    delivery_status: 'تحت الإنشاء',
    contract_year: 2024,
    contract_price: 12178380,
    paid_amount: 1387860,
    market_price: 14000000,
    installment_amount: 118425,
    installment_frequency: 'ربع سنوي',
    years_left: 6,
    willing_to_discount: true,
    discount_amount: 70000,
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'hamra-1': {
    id: 'hamra-1',
    code: 'U-10421',
    project_name: 'ميني كمبوند قصر الحمرا',
    developer_name: 'توليدو',
    area: 'التجمع الخامس',
    unit_type: 'شقة',
    size: 155,
    floor_number: 2,
    rooms: 3,
    bathrooms: 2,
    finishing: 'نصف تشطيب',
    delivery_status: 'جاهزة',
    contract_year: 2023,
    contract_price: 2850000,
    paid_amount: 2235000,
    market_price: 3200000,
    installment_amount: 45000,
    installment_frequency: 'ربع سنوي',
    years_left: 2,
    willing_to_discount: true,
    discount_amount: 100000,
  },
  'beit-watan-i76': {
    id: 'beit-watan-i76',
    code: 'U-10761',
    project_name: 'بيت الوطن الحي الأول قطعة i76 التجمع الخامس',
    developer_name: 'فينسيا للتطوير العقاري',
    area: 'التجمع الخامس',
    unit_type: 'شقة',
    size: 170,
    floor_number: 3,
    rooms: 3,
    bathrooms: 3,
    finishing: 'نصف تشطيب',
    delivery_status: 'تحت الإنشاء',
    contract_year: 2024,
    contract_price: 3120000,
    paid_amount: 1000000,
    market_price: 3500000,
    installment_amount: 65000,
    installment_frequency: 'ربع سنوي',
    years_left: 3,
    willing_to_discount: true,
    discount_amount: 50000,
  },
}

const fallbackSimilarOpportunities = [
  {
    id: 'aliva-1',
    name: 'اليفا',
    area: 'المستقبل سيتي',
    specs: 'شقة · 3 غرف · 190 م² · استلام 2028',
    cash: '3,750,000',
    image:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'madinaty',
    name: 'مدينتي',
    area: 'القاهرة الجديدة',
    specs: 'شقة · 2 غرف · 108 م² · استلام 2027',
    cash: '3,450,000',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'z-park',
    name: 'Z park PSR Towers',
    area: 'الشيخ زايد',
    specs: 'شقة · 3 غرف · 164 م² · استلام 2027',
    cash: '5,740,136',
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
]

export default function PropertyDetailsPage() {
  const params = useParams()
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || ''

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [readiness, setReadiness] = useState<'week' | 'month' | 'info'>('info')
  const [agreedToCommission, setAgreedToCommission] = useState(false)

  const [unitRow, setUnitRow] = useState<any | null>(null)
  const [similarDbUnits, setSimilarDbUnits] = useState<any[]>([])
  const [sameProjectCount, setSameProjectCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // بيانات نموذج اهتمام المشتري
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+20')
  const [buyerNotes, setBuyerNotes] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [offerSubmitted, setOfferSubmitted] = useState(false)
  const [offerError, setOfferError] = useState('')

  useEffect(() => {
    async function fetchPropertyDetails() {
      setLoading(true)
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        if (rawId && staticUnitsMap[rawId]) {
          setUnitRow(staticUnitsMap[rawId])
        } else if (rawId) {
          const { data: dbUnit } = await supabase
            .from('sell_requests')
            .select('*')
            .eq('id', rawId)
            .maybeSingle()

          if (dbUnit) {
            setUnitRow(dbUnit)

            if (dbUnit.area) {
              const { count } = await supabase
                .from('sell_requests')
                .select('id', { count: 'exact', head: true })
                .in('status', ['active', 'offer_received', 'transferring'])
                .eq('area', dbUnit.area)
                .neq('id', rawId)

              setSameProjectCount(count || 0)
            }
          }
        }

        const { data: otherUnits } = await supabase
          .from('sell_requests')
          .select(
            'id, project_name, area, unit_type, rooms, size, years_left, delivery_status, paid_amount, discount_amount, willing_to_discount, images'
          )
          .in('status', ['active', 'offer_received', 'transferring'])
          .neq('id', rawId)
          .order('created_at', { ascending: false })
          .limit(4)

        if (otherUnits && otherUnits.length > 0) {
          const mappedSimilar = otherUnits.map((u) => {
            const paid = Number(u.paid_amount) || 0
            const disc = u.willing_to_discount ? Number(u.discount_amount) || 0 : 0
            const reqCash = Math.max(0, paid - disc)
            const yearMatch = String(u.delivery_status || '').match(/20\d{2}/)
            const delivYear = yearMatch
              ? yearMatch[0]
              : String(u.delivery_status || '').includes('جاهز')
                ? 'جاهزة'
                : String(new Date().getFullYear() + (Number(u.years_left) || 2))

            return {
              id: u.id,
              name: u.project_name || 'وحدة معتمدة',
              area: u.area || 'القاهرة الجديدة',
              specs: `${u.unit_type || 'شقة'} · ${u.rooms || 3} غرف · ${
                u.size || 150
              } م² · استلام ${delivYear}`,
              cash: reqCash.toLocaleString('en-US'),
              image:
                Array.isArray(u.images) && u.images.length > 0 && u.images[0]
                  ? u.images[0]
                  : FALLBACK_UNIT_IMAGE,
            }
          })
          setSimilarDbUnits(mappedSimilar)
        }
      } catch (err) {
        console.error('Error loading unit details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyDetails()
  }, [rawId])

  const computedUnit = useMemo(() => {
    if (!unitRow) return null

    const row = unitRow
    const projectName = row.project_name || 'وحدة سكنية'
    const areaName = row.area || 'القاهرة الجديدة'
    const developerName = row.developer_name || ''
    const subtitle = developerName ? `${developerName} · ${areaName}` : areaName

    const numericId = String(row.id || '')
      .replace(/\D/g, '')
      .slice(0, 5)
    const fallbackId = String(row.id || '')
      .slice(0, 5)
      .toUpperCase()
    const code =
      row.code || `U-${numericId.length >= 4 ? numericId : fallbackId || '1001'}`

    const unitType = row.unit_type || 'شقة'
    const size = Number(row.size) || 0
    const floor =
      row.floor_number !== null &&
      row.floor_number !== undefined &&
      Number(row.floor_number) > 0
        ? String(row.floor_number)
        : 'متكرر'
    const rooms = Number(row.rooms) || 0
    const bathrooms = Number(row.bathrooms) || 0
    const finishing = row.finishing || 'نصف تشطيب'
    const deliveryStatus = row.delivery_status || 'تحت الإنشاء'
    const contractYear = Number(row.contract_year) || 2024

    const paidAmount = Number(row.paid_amount) || 0
    const contractPrice = Number(row.contract_price) || paidAmount
    const discountAmount = row.willing_to_discount
      ? Number(row.discount_amount) || 0
      : 0
    const requiredCash = Math.max(0, paidAmount - discountAmount)
    const remainingToDeveloper = Math.max(0, contractPrice - paidAmount)
    const marketPrice = Number(row.market_price) || 0
    const installmentAmount = Number(row.installment_amount) || 0
    const installmentFreq = row.installment_frequency || 'ربع سنوي'
    const yearsLeft = Number(row.years_left) || 0

    const pricePerMeter =
      size > 0 && contractPrice > 0 ? Math.round(contractPrice / size) : 0
    const commission = Math.round(contractPrice * 0.0125)
    const marketGain =
      marketPrice > contractPrice
        ? Math.max(0, marketPrice - (contractPrice - discountAmount) - commission)
        : 0
    const totalRequiredNow = requiredCash + commission
    const discountPercentage =
      paidAmount > 0 && discountAmount > 0
        ? Math.max(1, Math.round((discountAmount / paidAmount) * 100))
        : 5

    const yearMatch = String(deliveryStatus).match(/20\d{2}/)
    const deliveryYear = yearMatch
      ? yearMatch[0]
      : String(deliveryStatus).includes('جاهز')
        ? 'جاهزة للاستلام'
        : yearsLeft > 0
          ? String(new Date().getFullYear() + Math.min(yearsLeft, 6))
          : 'قريباً'

    // جلب الصور الحقيقية فقط بدون أي صور افتراضية دخيلة
    const validUrls = Array.isArray(row.images)
      ? row.images.filter((img: string) => Boolean(img && img.trim()))
      : []

    const unitGallery =
      validUrls.length > 0
        ? validUrls.map((url: string, index: number) => ({
            url,
            caption: `${projectName} — صورة ${index + 1}`,
          }))
        : [
            {
              url: FALLBACK_UNIT_IMAGE,
              caption: `${projectName} — صورة توضيحية`,
            },
          ]

    const specs = [
      { label: 'النوع', value: unitType },
      { label: 'المساحة', value: size > 0 ? `${size} م²` : '—' },
      { label: 'الدور', value: floor },
      { label: 'غرف', value: rooms > 0 ? String(rooms) : '—' },
      { label: 'حمامات', value: bathrooms > 0 ? String(bathrooms) : '—' },
      { label: 'التشطيب', value: finishing },
      { label: 'حالة البناء', value: deliveryStatus },
      { label: 'سنة التعاقد', value: String(contractYear) },
      {
        label: 'سعر المتر بالتعاقد',
        value:
          pricePerMeter > 0
            ? `${pricePerMeter.toLocaleString('en-US')} ج.م`
            : '—',
      },
    ]

    const tags: string[] =
      Array.isArray(row.features) && row.features.length > 0
        ? row.features
        : defaultTags

    const descriptionText =
      row.description ||
      `${unitType} ${rooms > 0 ? `${rooms} غرف ` : ''}في مشروع ${projectName} (${subtitle})${
        size > 0 ? `، بمساحة ${size} م²` : ''
      }. التشطيب ${finishing}، وحالة الوحدة ${deliveryStatus}. معروضة للتنازل المباشر بدون أوفر.`

    return {
      projectName,
      areaName,
      subtitle,
      code,
      gallery: unitGallery,
      specs,
      tags,
      descriptionText,
      requiredCash,
      paidAmount,
      willingToDiscount: Boolean(row.willing_to_discount),
      discountAmount: discountAmount || Math.round(paidAmount * 0.05),
      discountPercentage,
      marketPrice,
      marketGain,
      remainingToDeveloper,
      installmentAmount,
      installmentFreq,
      yearsLeft,
      deliveryYear,
      commission,
      totalRequiredNow,
    }
  }, [unitRow])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) {
      setScrollProgress(0)
      return
    }
    const currentScroll = Math.abs(el.scrollLeft)
    setScrollProgress(
      Math.min(100, Math.max(0, (currentScroll / maxScroll) * 100))
    )
  }

  const scrollByAmount = (direction: 'next' | 'prev') => {
    const el = scrollContainerRef.current
    if (!el) return
    const amount = direction === 'next' ? -360 : 360
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setScrollProgress(value)
    const el = scrollContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    el.scrollLeft = -((value / 100) * maxScroll)
  }

  const copyUnitCode = () => {
    if (!computedUnit) return
    navigator.clipboard?.writeText(computedUnit.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInterestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!computedUnit) return
    setOfferError('')
    setSubmittingOffer(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const cleanPhone = `${countryCode}${buyerPhone.replace(/^0+/, '').trim()}`
      const readinessLabel =
        readiness === 'week'
          ? 'جاهز للتنفيذ خلال أسبوع'
          : readiness === 'month'
            ? 'جاهز خلال شهر لـ 3 شهور'
            : 'يجمع معلومات ويقارن'

      const insertPayload: Record<string, any> = {
        name: buyerName.trim(),
        phone: cleanPhone,
        available_cash: computedUnit.requiredCash,
        budget: computedUnit.totalRequiredNow,
        max_installment: computedUnit.installmentAmount,
        payment_plan: `🎯 مهتم بوحدة: ${computedUnit.projectName} (${computedUnit.code}) · ${readinessLabel}${
          buyerNotes ? ` · أسئلة العميل: ${buyerNotes}` : ''
        }`,
        preferred_areas: [
          `🎯 حجز وحدة: ${computedUnit.projectName} (${computedUnit.code}) - ${computedUnit.areaName}`,
        ],
        unit_types: [computedUnit.specs[0]?.value || 'شقة'],
        delivery_status: computedUnit.deliveryYear,
      }

      const { error } = await supabase.from('buy_requests').insert(insertPayload)

      if (error) {
        console.error('Insert interest error:', error)
        setOfferError('تعذر تسجيل الطلب حالياً، يرجى المحاولة مرة أخرى.')
      } else {
        setOfferSubmitted(true)
      }
    } catch {
      setOfferError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.')
    } finally {
      setSubmittingOffer(false)
    }
  }

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f5f6f8] py-10 text-[#0a1122]">
        <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm font-bold text-gray-500 shadow-xs">
            جاري تحميل البيانات الحقيقية للوحدة...
          </div>
        </div>
      </main>
    )
  }

  if (!computedUnit) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f5f6f8] py-10 text-[#0a1122]">
        <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-xs">
            <h1 className="text-lg font-extrabold text-[#0a1122]">
              هذه الوحدة غير متاحة حالياً
            </h1>
            <p className="mt-2 text-xs text-gray-500">
              ربما تم بيع هذه الوحدة أو إزالتها من العرض.
            </p>
            <Link
              href="/opportunities"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#0b6954] px-6 text-xs font-bold text-white hover:bg-[#095443]"
            >
              تصفح الفرص المتاحة
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f6f8] py-6 text-[#0a1122] sm:py-10">
      <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
        
        {/* ==================== 1. رابط الرجوع العلوي ==================== */}
        <div className="flex items-center justify-start">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-[#0b6954]"
          >
            <ChevronRight className="size-3.5" />
            <span>رجوع للفرص</span>
          </Link>
        </div>

        {/* ==================== 2. هيدر الوحدة ==================== */}
        <header className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="text-right">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1122] sm:text-3xl">
              {computedUnit.projectName}
            </h1>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              {computedUnit.subtitle}
            </p>
            <button
              type="button"
              onClick={copyUnitCode}
              title="نسخ كود الوحدة"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11px] text-gray-500 transition hover:border-gray-300 hover:text-[#0a1122]"
            >
              <span>{computedUnit.code}</span>
              <Copy className="size-3 text-gray-400" />
              {copied && <span className="font-sans text-[10px] text-[#0b6954]">تم النسخ</span>}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e6f4f9] px-3 py-1 text-[11px] font-bold text-[#0b6954]">
              متحقق بالمستندات
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
              <Star className="size-3 fill-amber-400 text-amber-500" />
              <span>مميزة</span>
            </span>
            <button
              type="button"
              onClick={() =>
                navigator.share?.({
                  title: `${computedUnit.projectName} - دارك`,
                  url: window.location.href,
                })
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <Share2 className="size-3.5 text-gray-500" />
              <span>مشاركة</span>
            </button>
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${
                liked
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart className={`size-3.5 ${liked ? 'fill-current text-red-500' : 'text-gray-500'}`} />
              <span>أضف للمفضلة</span>
            </button>
          </div>
        </header>

        {/* ==================== 3. معرض الصور الحقيقية للوحدة (شريط سحب متجاوب) ==================== */}
        <section className="mt-5">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-gray-400"
            style={{ scrollbarWidth: 'thin' }}
          >
            {computedUnit.gallery.map((item: { url: string; caption: string }, idx: number) => (
              <div
                key={`${item.url}-${idx}`}
                onClick={() => setLightboxIndex(idx)}
                className={`group relative shrink-0 cursor-pointer snap-center overflow-hidden rounded-[18px] bg-gray-200 ${
                  computedUnit.gallery.length === 1
                    ? 'h-[250px] w-full sm:h-[360px]'
                    : idx === 0
                      ? 'h-[230px] w-[85%] sm:h-[310px] sm:w-[460px]'
                      : 'h-[230px] w-[70%] sm:h-[310px] sm:w-[300px]'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

                <span
                  className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/65 px-3.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-opacity ${
                    idx === 0 ? 'inline-flex' : 'hidden group-hover:inline-flex'
                  }`}
                >
                  <ZoomIn className="size-3.5" />
                  <span>اضغط لتكبير الصورة</span>
                </span>
              </div>
            ))}
          </div>

          {computedUnit.gallery.length > 1 && (
            <div className="mt-2 flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => scrollByAmount('prev')}
                aria-label="الصورة السابقة"
                className="flex size-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-[#0a1122]"
              >
                <ChevronRight className="size-3.5" />
              </button>

              <div className="relative flex flex-1 items-center">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scrollProgress}
                  onChange={handleSliderChange}
                  aria-label="شريط تحريك الصور"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-500"
                />
              </div>

              <button
                type="button"
                onClick={() => scrollByAmount('next')}
                aria-label="الصورة التالية"
                className="flex size-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-[#0a1122]"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* ==================== 4. مواصفات الوحدة ==================== */}
        <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-right sm:grid-cols-4">
            {computedUnit.specs.map((spec) => (
              <div key={spec.label}>
                <span className="block text-[11px] text-gray-400">{spec.label}</span>
                <strong className="mt-1 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {spec.value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 5. المميزات والوصف ==================== */}
        <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-5 text-right shadow-sm sm:p-6">
          {computedUnit.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {computedUnit.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-[11px] font-semibold text-gray-700"
                >
                  <Check className="size-3 text-[#0b6954]" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs leading-[1.9] text-gray-600 sm:text-[13px]">
            {computedUnit.descriptionText}
          </p>
        </section>

        {/* ==================== 6. البطاقة المالية الرئيسية ==================== */}
        <section className="mt-4 rounded-[18px] border border-[#b8e6d5] bg-white p-5 text-right shadow-sm sm:p-6">
          <p className="text-xs font-bold text-gray-500">المطلوب كاش دلوقتي</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#0a1122] sm:text-[34px]">
            {computedUnit.requiredCash.toLocaleString('en-US')}{' '}
            <span className="text-lg font-bold">ج.م</span>
          </p>
          <p className="mt-1 text-xs font-bold text-[#0b6954]">
            ده نفس المبلغ اللي دفعه صاحب الوحدة — من غير أوفر
          </p>

          {computedUnit.willingToDiscount && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-[#fffbeb] px-4 py-3 text-right">
              <p className="text-xs font-extrabold text-[#b45309]">↓ قابل للتفاوض</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#92400e]">
                البائع مستعد يتفاوض في حدود {computedUnit.discountPercentage}% من المدفوع (حوالي{' '}
                {computedUnit.discountAmount.toLocaleString('en-US')} ج.م) لسرعة التنفيذ.
              </p>
            </div>
          )}

          {computedUnit.marketGain > 0 && (
            <div className="mt-3 rounded-xl border border-[#c8eedd] bg-[#ecfbf3] px-4 py-3 text-right">
              <p className="text-xs font-extrabold text-[#0b6954]">
                مكسبك عن سعر السوق الحالي:{' '}
                <span dir="ltr">+ {computedUnit.marketGain.toLocaleString('en-US')}</span> ج.م
              </p>
              <p className="mt-1 text-[11px] text-[#0b6954]/85">
                سعر السوق اليوم: {computedUnit.marketPrice.toLocaleString('en-US')} ج.م · بعد خصم عمولتنا 1.25%
              </p>
            </div>
          )}

          <p className="mt-3 text-[10px] text-gray-400">
            سعر السوق ده تقدير صاحب الوحدة وعلى مسؤوليته — مش تقييم رسمي من المنصة.
          </p>
        </section>

        {/* ==================== 7. جدول تفصيل الأقساط والمطلوب ==================== */}
        <section className="mt-4 overflow-hidden rounded-[18px] border border-gray-200/80 bg-white shadow-sm">
          <div className="divide-y divide-gray-100 text-xs sm:text-[13px]">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">المتبقي للمطور (هتكمّله أقساط)</span>
              <strong className="font-extrabold text-[#0a1122]">
                {computedUnit.remainingToDeveloper.toLocaleString('en-US')} ج.م
              </strong>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">القسط</span>
              <strong className="font-extrabold text-[#0a1122]">
                {computedUnit.installmentAmount.toLocaleString('en-US')} ج.م · {computedUnit.installmentFreq}
              </strong>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">باقي على الأقساط تقريبًا</span>
              <strong className="font-extrabold text-[#0a1122]">
                {computedUnit.yearsLeft > 0 ? `${computedUnit.yearsLeft} سنة` : 'خالصة الأقساط'}
              </strong>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">الاستلام</span>
              <strong className="font-extrabold text-[#0a1122]">{computedUnit.deliveryYear}</strong>
            </div>

            <div className="px-5 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  عمولة المنصة على المشتري (1.25% من إجمالي التعاقد)
                </span>
                <strong className="font-extrabold text-[#0a1122]">
                  {computedUnit.commission.toLocaleString('en-US')} ج.م
                </strong>
              </div>
              <p className="mt-1 text-right text-[10px] text-gray-400">
                بتدفع بس عند إتمام التنازل — للبايع مجانًا تمامًا، مفيش عمولة عليه
              </p>
            </div>

            <div className="flex items-center justify-between bg-[#f1f5f9] px-5 py-4">
              <span className="font-extrabold text-[#0a1122]">إجمالي المطلوب منك دلوقتي</span>
              <strong className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                {computedUnit.totalRequiredNow.toLocaleString('en-US')} ج.م
              </strong>
            </div>
          </div>
        </section>

        {/* ==================== 8. الوحدات الأخرى في نفس المنطقة ==================== */}
        {sameProjectCount > 0 && (
          <section className="mt-4 flex items-center justify-between rounded-[16px] border border-gray-200/80 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3 text-right">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#0b6954]">
                <Building2 className="size-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#0a1122] sm:text-[13px]">
                  في {sameProjectCount} وحدة تانية في {computedUnit.areaName}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  بأسعار كاش ومساحات متنوعة بدون أوفر
                </p>
              </div>
            </div>

            <Link
              href="/opportunities"
              className="shrink-0 text-xs font-bold text-[#0b6954] hover:underline"
            >
              شوفهم كلهم
            </Link>
          </section>
        )}

        {/* ==================== 9. فرص مميزة مشابهة ==================== */}
        {similarDbUnits.length > 0 && (
          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-right">
              <h2 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
                فرص مميزة مشابهة
              </h2>
              <span className="text-[11px] text-gray-400">
                وحدات حقيقية أخرى معروضة للتنازل بدون أوفر
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
              {similarDbUnits.map((item) => (
                <Link
                  key={item.id}
                  href={`/opportunities/${item.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-[16px] border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="relative h-28 w-full overflow-hidden bg-gray-100 sm:h-36">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-amber-700 shadow-sm">
                        <Star className="size-2.5 fill-amber-400 text-amber-500" />
                        <span>مميزة</span>
                      </span>
                    </div>

                    <div className="p-3 text-right">
                      <h3 className="line-clamp-1 text-xs font-extrabold text-[#0a1122] group-hover:text-[#0b6954] sm:text-[13px]">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-gray-400">{item.area}</p>
                      <p className="mt-1.5 line-clamp-1 text-[10px] text-gray-500">{item.specs}</p>
                      <p className="mt-2 text-[11px] font-extrabold text-[#0a1122]">
                        المطلوب كاش: {item.cash} ج.م
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0b6954]">
                      <span>شوف التفاصيل</span>
                      <span>←</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ==================== 10. نموذج حجز الوحدة (يُسجل في جدول المشترين بالأدمن) ==================== */}
        <section className="mt-8 rounded-[20px] border border-gray-200/90 bg-white p-5 text-right shadow-sm sm:p-8">
          <h2 className="text-lg font-extrabold text-[#0a1122] sm:text-xl">
            عايز تلحق تحجز الفرصة دي؟
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            سجّل بياناتك دلوقتي — مسؤول حالة هيتواصل معاك بتفاصيل الوحدة ({computedUnit.code}) وإجراءات التنازل.
          </p>

          {offerSubmitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-sm font-extrabold text-emerald-800">
                تم تسجيل اهتمامك بالوحدة ({computedUnit.projectName}) بنجاح! 🎉
              </p>
              <p className="mt-1.5 text-xs text-emerald-700">
                تم إرسال طلبك لقسم المشترين في لوحة الأدمن مع تحديد كود هذه الوحدة، وسيتواصل معك مسؤول الحالة في أقرب وقت.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInterestSubmit} className="mt-6 space-y-5">
              {offerError && (
                <div className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                  {offerError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#0a1122]">الاسم</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="اكتب اسمك الكامل"
                  required
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#0a1122]">رقم الواتساب</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    dir="ltr"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    required
                    className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-right text-xs font-medium text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:text-sm"
                  />
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-11 appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                    >
                      <option value="+20">🇪🇬 مصر +20</option>
                      <option value="+966">🇸🇦 السعودية +966</option>
                      <option value="+971">🇦🇪 الإمارات +971</option>
                    </select>
                    <ChevronLeft className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 -rotate-90 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                  إيه الأسئلة أو التفاصيل اللي تحب نوضحهالك في المكالمة؟
                </label>
                <textarea
                  rows={3}
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  placeholder="اختياري..."
                  className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:outline-none sm:text-sm"
                />
              </div>

              <fieldset>
                <legend className="mb-2.5 text-xs font-bold text-[#0a1122]">
                  إنت جاهز للتنفيذ في قد إيه؟
                </legend>
                <div className="space-y-2.5">
                  <label
                    onClick={() => setReadiness('week')}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs transition ${
                      readiness === 'week'
                        ? 'border-[#0b6954] bg-[#eff8f6] font-bold text-[#0a1122]'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="readiness"
                      checked={readiness === 'week'}
                      onChange={() => setReadiness('week')}
                      className="size-4 accent-[#0b6954]"
                    />
                    <span>معايا الكاش وجاهز أنفّذ خلال أسبوع لو الورق سليم</span>
                  </label>

                  <label
                    onClick={() => setReadiness('month')}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs transition ${
                      readiness === 'month'
                        ? 'border-[#0b6954] bg-[#eff8f6] font-bold text-[#0a1122]'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="readiness"
                      checked={readiness === 'month'}
                      onChange={() => setReadiness('month')}
                      className="size-4 accent-[#0b6954]"
                    />
                    <span>جاهز خلال شهر لـ 3 شهور</span>
                  </label>

                  <label
                    onClick={() => setReadiness('info')}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs transition ${
                      readiness === 'info'
                        ? 'border-[#0b6954] bg-[#eff8f6] font-bold text-[#0a1122]'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="readiness"
                      checked={readiness === 'info'}
                      onChange={() => setReadiness('info')}
                      className="size-4 accent-[#0b6954]"
                    />
                    <span>لسه بجمع معلومات وبقارن</span>
                  </label>
                </div>
              </fieldset>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-xs leading-relaxed text-gray-700">
                <input
                  type="checkbox"
                  checked={agreedToCommission}
                  onChange={(e) => setAgreedToCommission(e.target.checked)}
                  required
                  className="mt-0.5 size-4 rounded accent-[#0b6954]"
                />
                <span>
                  أوافق على عمولة المنصة للمشتري (1.25% من إجمالي سعر التعاقد) وتُدفع عند إتمام التنازل فقط.
                </span>
              </label>

              <div className="flex justify-center">
                <div className="flex h-14 w-full max-w-[300px] items-center justify-between rounded-lg border border-gray-200 bg-[#fafafa] px-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#10b981] text-white">
                      <Check className="size-3.5 stroke-[3]" />
                    </span>
                    <span className="text-xs font-bold text-gray-700">تحقق ناجح!</span>
                  </div>
                  <div className="text-left">
                    <span className="block font-sans text-[10px] font-extrabold tracking-tight text-gray-600">
                      CLOUDFLARE
                    </span>
                    <span className="block font-sans text-[8px] text-gray-400">Turnstile</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingOffer}
                className="h-12 w-full rounded-xl bg-[#0b6954] text-sm font-bold text-white shadow-sm transition hover:bg-[#095443] disabled:opacity-50"
              >
                {submittingOffer ? 'جاري تسجيل اهتمامك...' : 'أكّد اهتمامي بالوحدة'}
              </button>

              <p className="text-center text-[10px] text-gray-400">
                بياناتك في أمان — مش بنشاركها مع أي طرف.
              </p>
            </form>
          )}
        </section>
      </div>

      {/* ==================== نافذة تكبير الصور (Lightbox Modal) ==================== */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="mb-4 flex w-full max-w-4xl items-center justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </button>
            <span className="text-xs font-bold">
              {lightboxIndex + 1} / {computedUnit.gallery.length} —{' '}
              {computedUnit.gallery[lightboxIndex]?.caption}
            </span>
          </div>

          <div
            className="relative flex w-full max-w-4xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {computedUnit.gallery.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null
                      ? (prev - 1 + computedUnit.gallery.length) % computedUnit.gallery.length
                      : 0
                  )
                }
                className="absolute right-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 sm:right-4 sm:size-12"
                aria-label="السابق"
              >
                <ChevronRight className="size-6" />
              </button>
            )}

            <img
              src={computedUnit.gallery[lightboxIndex]?.url}
              alt={computedUnit.gallery[lightboxIndex]?.caption}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {computedUnit.gallery.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % computedUnit.gallery.length : 0
                  )
                }
                className="absolute left-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 sm:left-4 sm:size-12"
                aria-label="التالي"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
          </div>

          {computedUnit.gallery.length > 1 && (
            <div
              className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {computedUnit.gallery.map(
                (img: { url: string; caption: string }, idx: number) => (
                  <button
                    key={`${img.url}-${idx}`}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      lightboxIndex === idx
                        ? 'scale-105 border-[#2ee59d]'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </main>
  )
}