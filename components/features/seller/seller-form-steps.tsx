'use client'

import {
  AlertCircle,
  Eye,
  FileCheck2,
  FileText,
  ImagePlus,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TurnstileBox } from '@/components/layouts/auth-layout'
import { GeorgiaAreaSelect } from '@/components/shared/georgia-areas'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import {
  ACTIVE_PLATFORM_COUNTRY,
  isImageFileUrl,
  type SellerDocKey,
  type SellerExtraLabels,
  type UploadedDocEntry,
} from './seller-i18n'
import {
  Field,
  formatAmount,
  getLocalizedDeliveries,
  getLocalizedFeatures,
  getLocalizedFinishings,
  getLocalizedUnitTypes,
  isReadyDeliveryOption,
  isUnderConstructionDeliveryOption,
  MoneyField,
  MonthYearSelector,
  Pills,
  RequiredLabel,
  toEnglishDigits,
  ToggleSection,
  years,
} from './seller-shared'

export function StepValidationBanner({
  missingFields,
  prefixText,
}: {
  missingFields: string[]
  prefixText: string
}) {
  if (!missingFields.length) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50/90 p-3.5 text-start text-xs leading-relaxed text-red-800 shadow-2xs"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
      <div>
        <strong className="font-extrabold">{prefixText} </strong>
        <span className="font-bold">{missingFields.join(' ، ')}</span>
      </div>
    </div>
  )
}

export function BasicStep({
  form,
  update,
  go,
  errors,
  missingFields,
  missingPrefix,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  missingFields: string[]
  missingPrefix: string
}) {
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const t = s.basicStep
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)

  return (
    <div className="flex flex-col gap-6">
      <Field
        error={errors.developer}
        label={t.developer}
        id="developer"
        value={form.developer}
        update={(value) => {
          update('developer', value)
          update('developerDetails', value)
        }}
      />
      <Field
        error={errors.project}
        label={t.project}
        id="project"
        value={form.project}
        update={(value) => {
          update('project', value)
          update('projectDetails', value)
        }}
      />
      <MoneyField
        error={errors.contractPrice}
        label={t.contractPrice}
        value={form.contractPrice}
        currencySymbol={currency}
        update={(value) => {
          update('contractPrice', value)
          update('contractPrice2', value)
        }}
      />
      <MoneyField
        error={errors.paidAmount}
        label={t.paidAmount}
        value={form.paidAmount}
        currencySymbol={currency}
        update={(value) => {
          update('paidAmount', value)
          update('paidAmount2', value)
        }}
      />
      <div className="rounded-xl bg-sky-50 p-4 text-sm font-semibold text-sky-700">
        {t.receiveBoxPrefix}{' '}
        <span dir="ltr">
          {Number(toEnglishDigits(form.paidAmount || '0')).toLocaleString(
            'en-US'
          )}
        </span>{' '}
        {currency} {t.receiveBoxSuffix}
      </div>
      <div>
        <label
          dir={dir}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-start text-sm leading-7 ${
            errors.confirmed
              ? 'border-red-500 bg-red-50/30'
              : 'border-slate-200'
          }`}
        >
          <Checkbox
            className="m-0 shrink-0"
            checked={form.confirmed === 'yes'}
            onCheckedChange={(checked) =>
              update('confirmed', checked ? 'yes' : '')
            }
          />
          {t.confirmLabel}
        </label>
        {errors.confirmed && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
            {errors.confirmed}
          </p>
        )}
      </div>
      <Field
        label={t.currentDevPrice}
        id="currentDeveloperPrice"
        type="number"
        helper={
          form.currentDeveloperPrice
            ? formatAmount(form.currentDeveloperPrice, currency, locale)
            : t.currentDevPriceHelper
        }
        value={form.currentDeveloperPrice}
        update={(value) => {
          update('currentDeveloperPrice', value)
          if (!form.marketPrice) update('marketPrice', value)
        }}
      />

      <TurnstileBox />

      <StepValidationBanner
        missingFields={missingFields}
        prefixText={missingPrefix}
      />

      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
        onClick={() => go(2)}
      >
        {s.shared.nextBtn}
      </Button>
    </div>
  )
}

export function DetailsStep({
  form,
  update,
  selected,
  toggle,
  go,
  errors,
  showBasicFields,
  missingFields,
  missingPrefix,
  onSave,
  extraT,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  showBasicFields: boolean
  missingFields: string[]
  missingPrefix: string
  onSave: () => void
  extraT: SellerExtraLabels
}) {
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const t = s.detailsStep as Record<string, any>

  const localizedUnitTypes = getLocalizedUnitTypes(dict, locale)
  const localizedFinishings = getLocalizedFinishings(dict, locale)
  const localizedDeliveries = getLocalizedDeliveries(dict, locale)
  const localizedFeatures = getLocalizedFeatures(dict, locale)

  const chosenDelivery = selected.delivery?.[0] || ''
  const needsDeliveryMonths = isUnderConstructionDeliveryOption(chosenDelivery)

  return (
    <div className="flex flex-col gap-6">
      {showBasicFields && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={errors.developerDetails}
            label={s.basicStep.developer}
            id="developerDetails"
            value={form.developerDetails ?? form.developer}
            update={(value) => {
              update('developerDetails', value)
              update('developer', value)
            }}
          />
          <Field
            error={errors.projectDetails}
            label={s.basicStep.project}
            id="projectDetails"
            value={form.projectDetails ?? form.project}
            update={(value) => {
              update('projectDetails', value)
              update('project', value)
            }}
          />
        </div>
      )}

      <GeorgiaAreaSelect
        label={t.georgiaLocationLabel || extraT.georgiaLocationLabel}
        value={form.location ?? ''}
        onChange={(area) => update('location', area)}
        error={errors.location}
        placeholder={t.georgiaLocationPlaceholder}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">
          <RequiredLabel>{t.unitTypeLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.type}
          items={localizedUnitTypes}
          selected={selected.type ?? []}
          onToggle={(value) => toggle('type', value)}
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Field
          error={errors.areaSize}
          label={t.areaSizeLabel}
          id="areaSize"
          type="number"
          value={form.areaSize}
          update={(value) => update('areaSize', value)}
        />
        <Field
          label={t.gardenLabel}
          id="garden"
          type="number"
          value={form.garden}
          update={(value) => update('garden', value)}
        />
        <Field
          error={errors.rooms}
          label={t.roomsLabel}
          id="rooms"
          type="number"
          value={form.rooms}
          update={(value) => update('rooms', value)}
        />
        <Field
          error={errors.bathrooms}
          label={t.bathroomsLabel}
          id="bathrooms"
          type="number"
          value={form.bathrooms}
          update={(value) => update('bathrooms', value)}
        />
      </div>

      {selected.type?.[0] === localizedUnitTypes[0] && (
        <Field
          error={errors.floor}
          label={t.floorLabel}
          id="floor"
          type="number"
          helper={t.floorHelper}
          value={form.floor}
          update={(value) => update('floor', value)}
        />
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">
          <RequiredLabel>{t.finishingLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.finishing}
          items={localizedFinishings}
          selected={selected.finishing ?? []}
          onToggle={(value) => toggle('finishing', value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">
          <RequiredLabel>{t.deliveryLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.delivery}
          items={localizedDeliveries}
          selected={selected.delivery ?? []}
          onToggle={(value) => {
            toggle('delivery', value)
            if (isReadyDeliveryOption(value)) {
              update('deliveryRemainingMonths', '0')
            }
          }}
        />
      </fieldset>

      {needsDeliveryMonths && (
        <Field
          error={errors.deliveryDate}
          label={t.deliveryMonthsLabel || extraT.deliveryMonthsLabel}
          id="deliveryRemainingMonths"
          type="number"
          helper={t.deliveryMonthsHelper || extraT.deliveryMonthsHelper}
          value={form.deliveryRemainingMonths}
          update={(value) => update('deliveryRemainingMonths', value)}
        />
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">{t.featuresLabel}</legend>
        <Pills
          items={localizedFeatures}
          selected={selected.features ?? []}
          onToggle={(value) => toggle('features', value)}
          multi
        />
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-start">
          <RequiredLabel>{t.descriptionLabel}</RequiredLabel>
        </Label>
        <Textarea
          id="description"
          dir={dir}
          value={form.description ?? ''}
          onChange={(event) => update('description', event.target.value)}
          className={`min-h-32 rounded-xl text-start ${
            errors.description ? 'border-red-500 bg-red-50/20' : ''
          }`}
        />
        {errors.description && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <StepValidationBanner
        missingFields={missingFields}
        prefixText={missingPrefix}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
          onClick={() => go(4)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

export function PricingStep({
  form,
  update,
  selected,
  toggle,
  go,
  errors,
  setErrors,
  showBasicPriceFields,
  missingFields,
  missingPrefix,
  onSave,
  extraT,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  showBasicPriceFields: boolean
  missingFields: string[]
  missingPrefix: string
  onSave: () => void
  extraT: SellerExtraLabels
}) {
  const { t: dict, locale } = useTranslation()
  const s = dict.sell
  const t = s.pricingStep as Record<string, any>
  const yes = (group: string) => selected[group]?.[0] === 'yes'
  const setAnswer = (group: string, value: string) => toggle(group, value)
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)

  return (
    <div className="flex flex-col gap-6">
      {showBasicPriceFields && (
        <>
          <MoneyField
            error={errors.contractPrice}
            label={s.basicStep.contractPrice}
            value={form.contractPrice ?? form.contractPrice2}
            currencySymbol={currency}
            update={(value) => {
              update('contractPrice', value)
              update('contractPrice2', value)
            }}
          />

          <MoneyField
            error={errors.paidAmount}
            label={s.basicStep.paidAmount}
            value={form.paidAmount ?? form.paidAmount2}
            currencySymbol={currency}
            update={(value) => {
              update('paidAmount', value)
              update('paidAmount2', value)
            }}
          />
        </>
      )}

      <MonthYearSelector
        label={t.contractMonthYearLabel || extraT.contractMonthYearLabel}
        monthValue={form.contractMonth || ''}
        yearValue={form.contractYear || selected.year?.[0] || ''}
        yearsList={years}
        error={errors.year}
        onMonthChange={(m) => {
          update('contractMonth', m)
          setErrors((curr) => ({ ...curr, year: '' }))
        }}
        onYearChange={(y) => {
          update('contractYear', y)
          toggle('year', y)
          setErrors((curr) => ({ ...curr, year: '' }))
        }}
      />

      {(!form.currentDeveloperPrice || showBasicPriceFields) && (
        <MoneyField
          error={errors.marketPrice}
          label={t.marketPriceLabel}
          value={form.marketPrice}
          currencySymbol={currency}
          update={(value) => update('marketPrice', value)}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <MoneyField
          error={errors.installment}
          label={t.installmentLabel}
          value={form.installment}
          currencySymbol={currency}
          update={(value) => update('installment', value)}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="text-start font-bold">
            <RequiredLabel>{t.frequencyLabel}</RequiredLabel>
          </legend>
          <Pills
            error={errors.frequency}
            items={t.frequencies}
            selected={selected.frequency ?? []}
            onToggle={(value) => toggle('frequency', value)}
          />
        </fieldset>
      </div>

      <Field
        error={errors.remainingMonths}
        label={t.remainingMonthsLabel || extraT.remainingMonthsLabel}
        id="remainingMonths"
        type="number"
        helper={t.remainingMonthsHelper || extraT.remainingMonthsHelper}
        value={form.remainingMonths}
        update={(value) => update('remainingMonths', value)}
      />

      <ToggleSection
        error={errors.annualInstallment}
        title={t.annualInstallmentQuestion}
        group="annualInstallment"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('annualInstallment') && (
        <MoneyField
          label={t.annualInstallmentAmountLabel}
          value={form.annualInstallmentAmount}
          currencySymbol={currency}
          update={(value) => update('annualInstallmentAmount', value)}
        />
      )}

      <ToggleSection
        error={errors.discountOffer}
        title={t.discountQuestion}
        group="discountOffer"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('discountOffer') && (
        <MoneyField
          label={t.discountAmountLabel}
          value={form.discountAmount}
          currencySymbol={currency}
          update={(value) => update('discountAmount', value)}
        />
      )}

      <ToggleSection
        error={errors.overdueInstallments}
        title={t.overdueQuestion}
        group="overdueInstallments"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('overdueInstallments') && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Field
            label={t.overdueCountLabel}
            id="overdueCount"
            type="number"
            value={form.overdueCount}
            update={(value) => update('overdueCount', value)}
          />
          <MoneyField
            label={t.overdueTotalLabel}
            value={form.overdueTotal}
            currencySymbol={currency}
            update={(value) => update('overdueTotal', value)}
          />
        </div>
      )}

      <StepValidationBanner
        missingFields={missingFields}
        prefixText={missingPrefix}
      />

      <div className="mt-2 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(3)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
          onClick={() => go(5)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

export function PhotosStep({
  go,
  images,
  setImages,
  uploading,
  setUploading,
  onPreviewDoc,
  onSave,
}: {
  go: (step: number) => void
  images: string[]
  setImages: (images: string[]) => void
  uploading: boolean
  setUploading: (value: boolean) => void
  onPreviewDoc: (url: string, title: string) => void
  onSave: () => void
}) {
  const { t: dict } = useTranslation()
  const s = dict.sell
  const t = s.photosStep as Record<string, any>

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    const supabase = createClient()
    const uploaded: string[] = []
    for (const file of Array.from(files).slice(0, 10 - images.length)) {
      const path = `units/${crypto.randomUUID()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        '-'
      )}`
      const result = await supabase.storage
        .from('unit-images')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (!result.error)
        uploaded.push(
          supabase.storage.from('unit-images').getPublicUrl(path).data.publicUrl
        )
    }
    setImages([...images, ...uploaded])
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/40 p-6 text-center transition hover:border-[#007a5a] hover:bg-slate-50">
        <ImagePlus className="size-9 text-[#007a5a]" />
        <p className="text-base font-extrabold text-[#0a1122]">{t.uploadTitle}</p>
        <p className="text-xs text-slate-500 sm:text-sm">{t.uploadSub}</p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => upload(event.target.files)}
        />
      </label>

      {uploading && (
        <div className="flex items-center gap-2 text-start text-sm font-bold text-teal-700">
          <Loader2 className="size-4 animate-spin" />
          <span>{t.uploadingText}</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
            >
              <img
                src={url}
                alt=""
                onClick={() => onPreviewDoc(url, t.uploadTitle)}
                className="h-full w-full cursor-pointer object-cover transition group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() =>
                  setImages(images.filter((_, idx) => idx !== index))
                }
                className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(4)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
          onClick={() => go(6)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>

      <div className="mt-2 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

export function DocumentsStep({
  go,
  unitDocs,
  uploadingDocKey,
  onUploadDoc,
  onRemoveDoc,
  onPreviewDoc,
  onSave,
  extraT,
}: {
  go: (step: number) => void
  unitDocs: Record<string, UploadedDocEntry>
  uploadingDocKey: string | null
  onUploadDoc: (docKey: SellerDocKey, files: FileList | null) => void
  onRemoveDoc: (docKey: SellerDocKey) => void
  onPreviewDoc: (url: string, title: string) => void
  onSave: () => void
  extraT: SellerExtraLabels
}) {
  const { t: dict } = useTranslation()
  const s = dict.sell
  const docDict = dict.accountPages?.documents as Record<string, any>

  const docSections: Array<{ key: SellerDocKey; title: string }> = [
    { key: 'contract', title: docDict?.sections?.contract || 'عقد الوحدة' },
    { key: 'receipts', title: docDict?.sections?.receipts || 'إيصالات السداد' },
    { key: 'statement', title: docDict?.sections?.statement || 'كشف الحساب' },
    {
      key: 'passport',
      title: docDict?.sections?.passport || 'جواز السفر (Passport)',
    },
  ]

  const uploadedDocsCount = docSections.filter((sec) =>
    Boolean(unitDocs[sec.key]?.url)
  ).length

  const allDocsUploaded = uploadedDocsCount === 4

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-start sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#007a5a]" />
            <div>
              <h3 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                {extraT.docsConditionTitle}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-700 sm:text-[13px]">
                {extraT.docsConditionDesc}
              </p>
            </div>
          </div>

          <span
            dir="ltr"
            className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#007a5a] shadow-2xs"
          >
            {uploadedDocsCount}/4
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {docSections.map((sec) => {
          const entry = unitDocs[sec.key]
          const isUploadingThis = uploadingDocKey === sec.key
          const hasDoc = Boolean(entry?.url)
          const isImg = hasDoc && isImageFileUrl(entry.url, entry.name)

          return (
            <div
              key={sec.key}
              className={`flex flex-col justify-between rounded-2xl border p-4 shadow-2xs transition ${
                hasDoc
                  ? 'border-emerald-200 bg-emerald-50/25'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {hasDoc && (
                    <FileCheck2 className="size-4 shrink-0 text-[#007a5a]" />
                  )}
                  <span className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {sec.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#007a5a] px-3 text-[11px] font-bold text-white transition hover:bg-[#006248]">
                    {isUploadingThis ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : hasDoc ? (
                      <>
                        <RefreshCw className="size-3" />
                        <span>
                          {docDict?.changeFileBtn || extraT.changeFileBtn}
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5" />
                        <span>{docDict?.uploadBtn || extraT.uploadFileBtn}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      disabled={isUploadingThis}
                      onChange={(e) => onUploadDoc(sec.key, e.target.files)}
                    />
                  </label>

                  {hasDoc && (
                    <button
                      type="button"
                      onClick={() => onRemoveDoc(sec.key)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      title={docDict?.removeFileBtn || extraT.removeFileBtn}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {hasDoc ? (
                <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-2xs">
                  {isImg ? (
                    <button
                      type="button"
                      onClick={() => onPreviewDoc(entry.url, sec.title)}
                      className="group relative size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                    >
                      <img
                        src={entry.url}
                        alt={sec.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                        <Eye className="size-3.5 text-white" />
                      </span>
                    </button>
                  ) : (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-teal-50 text-[10px] font-bold text-teal-800"
                    >
                      <FileText className="size-4" />
                      <span>PDF</span>
                    </a>
                  )}
                  <div className="min-w-0 flex-1 text-start">
                    <p className="truncate text-[11px] font-bold text-[#0a1122]">
                      {entry.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => onPreviewDoc(entry.url, sec.title)}
                      className="mt-0.5 text-[10.5px] font-bold text-[#007a5a] hover:underline"
                    >
                      {docDict?.viewFullImageBtn || extraT.viewFullImageBtn}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2.5 text-[11px] text-slate-400">
                  {docDict?.emptySection}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(5)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
          onClick={() => go(7)}
        >
          {allDocsUploaded
            ? extraT.continueToReviewBtn
            : extraT.continueUploadLaterBtn}
        </Button>
      </div>

      <div className="mt-2 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}
