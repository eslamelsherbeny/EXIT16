'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const unitTypes = [
  'شقة',
  'دوبلكس',
  'بنتهاوس',
  'تاون هاوس',
  'توين هاوس',
  'اي فيلا',
  'فيلا',
  'شاليه',
  'مكتب',
  'محل',
  'عيادة',
  'أرض',
]

export const finishings = ['تشطيب كامل', 'نص تشطيب', 'على الطوب', 'متشطبة بالفرش']
export const deliveries = ['جاهزة للاستلام', 'تحت الإنشاء']
export const features = [
  'حمام سباحة',
  'جاردن خاصة',
  'رووف',
  'أمن 24 ساعة',
  'كلوب هاوس',
  'جراج',
  'مصعد',
  'قريبة من الخدمات',
]
export const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019']

export const areasCatalog = [
  [
    'القاهرة الجديدة والتجمع',
    [
      'التجمع الخامس',
      'التجمع الأول',
      'التجمع الثالث',
      'القاهرة الجديدة',
      'الرحاب',
      'مدينتي',
      'المستقبل سيتي',
      'الشروق',
    ],
  ],
  [
    'الشيخ زايد وأكتوبر',
    ['الشيخ زايد', 'زايد الجديدة', '6 أكتوبر', 'حدائق أكتوبر'],
  ],
  [
    'العاصمة والساحل وأخرى',
    [
      'العاصمة الإدارية',
      'الساحل الشمالي',
      'العين السخنة',
      'رأس الحكمة',
      'منطقتي مش في القائمة',
    ],
  ],
] as const

export function formatAmount(value?: string) {
  const amount = Number((value ?? '').replace(/,/g, ''))
  if (!amount) return ''
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} مليون ج.م`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} ألف ج.م`
  return `${amount.toLocaleString('en-US')} ج.م`
}

export function RequiredLabel({ children }: { children: string }) {
  const required = children.endsWith(' *')
  return (
    <>
      {required ? (
        <>
          {children.slice(0, -2)} <span className="mr-1 text-red-500">*</span>
        </>
      ) : (
        children
      )}
    </>
  )
}

export function Field({
  label,
  id,
  type = 'text',
  helper,
  placeholder,
  value,
  update,
  error,
}: {
  label: string
  id: string
  type?: string
  helper?: string
  placeholder?: string
  value?: string
  update: (value: string) => void
  error?: string
}) {
  const arabic = [
    'developer',
    'project',
    'developerDetails',
    'projectDetails',
    'name',
    'location',
  ].includes(id)
  const compact = [
    'areaSize',
    'garden',
    'rooms',
    'bathrooms',
    'floor',
    'remainingYears',
  ].includes(id)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={arabic ? 'text-right' : undefined}>
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        dir={
          compact || type === 'number' || id === 'email' || id === 'password'
            ? 'ltr'
            : arabic
              ? 'rtl'
              : undefined
        }
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => update(event.target.value)}
        className={`h-12 rounded-xl ${
          error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
        } ${
          compact
            ? 'max-w-[150px] self-start text-center font-semibold'
            : type === 'number' || id === 'email' || id === 'password'
              ? 'text-left'
              : arabic
                ? 'text-right'
                : ''
        }`}
      />
      {error && (
        <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      {helper && (
        <span className="text-right text-xs font-semibold leading-6 text-teal-700">
          {helper}
        </span>
      )}
    </div>
  )
}

export function MoneyField({
  label,
  value,
  update,
  helper,
  error,
}: {
  label: string
  value?: string
  update: (value: string) => void
  helper?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-right">
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={
            value ? Number(value.replace(/,/g, '')).toLocaleString('en-US') : ''
          }
          onChange={(event) =>
            update(event.target.value.replace(/[^0-9]/g, ''))
          }
          className={`h-12 rounded-xl pr-4 pl-12 text-left ${
            error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
          }`}
        />
        <span className="absolute top-3 right-3 text-sm text-slate-500">
          ج.م
        </span>
      </div>
      {error && (
        <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      <span className="text-right text-xs font-semibold leading-6 text-teal-700">
        {formatAmount(value) || helper || ''}
      </span>
    </div>
  )
}

export function Pills({
  items,
  selected,
  onToggle,
  multi = false,
  error,
}: {
  items: string[]
  selected: string[]
  onToggle: (value: string) => void
  multi?: boolean
  error?: string
}) {
  return (
    <div
      className={
        error ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5' : ''
      }
    >
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              selected.includes(item)
                ? 'border-[#0c513f] bg-[#f0fdf9] font-bold text-[#0c513f]'
                : 'border-slate-200 bg-white hover:border-teal-500'
            }`}
          >
            {multi && selected.includes(item) && '✓ '}
            {item}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function ToggleSection({
  title,
  group,
  selected,
  toggle,
  error,
}: {
  title: string
  group: string
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  error?: string
}) {
  const active = selected[group]?.[0]
  return (
    <section
      className={`rounded-2xl border p-5 ${
        error
          ? 'border-red-500 bg-red-50/20'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <h3 className="mb-3 text-right font-bold">{title}</h3>
      <div className="flex justify-start gap-2">
        <Button
          type="button"
          variant={active === 'yes' ? 'default' : 'outline'}
          className={`min-w-[80px] rounded-xl border px-5 py-2 text-sm font-semibold ${
            active === 'yes' ? 'bg-[#11192d] text-white' : ''
          }`}
          onClick={() => toggle(group, 'yes')}
        >
          أيوه
        </Button>
        <Button
          type="button"
          variant={active === 'no' ? 'default' : 'outline'}
          className={`min-w-[80px] rounded-xl border px-5 py-2 text-sm font-semibold ${
            active === 'no' ? 'bg-[#11192d] text-white' : ''
          }`}
          onClick={() => toggle(group, 'no')}
        >
          لأ
        </Button>
      </div>
      {error && (
        <p className="mt-2.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  )
}

export function Actions({
  go,
  next,
  back = true,
  label = 'كمّل',
}: {
  go: (step: number) => void
  next: number
  back?: boolean
  label?: string
}) {
  return (
    <div dir="rtl" className="mt-5 flex gap-3">
      {back && (
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(next - 2)}
        >
          ارجع
        </Button>
      )}
      <Button
        type="button"
        className={`h-12 rounded-xl bg-[#11192d] hover:bg-[#1b2742] ${
          !back ? 'w-full' : 'flex-1'
        }`}
        onClick={() => go(next)}
      >
        {label}
      </Button>
    </div>
  )
}