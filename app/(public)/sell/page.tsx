import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { FunnelShell, FormSection, TurnstileBox } from '@/components/funnel-shell'

export default function SellPage() {
  return <FunnelShell title="عايز تخرج من تعاقدك؟ خليها بحساب" benefits={['نقيّم وحدتك بسعر عادل', 'نوصلّك بالمشتري المناسب', 'بياناتك في أمان كامل']} step="خطوة 1 من 6" totalSteps={6}>
    <div className="flex flex-col gap-10">
      <FormSection title="بيانات الوحدة المالية">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="اسم المطور" id="developer" placeholder="مثال: بالم هيلز" />
          <Field label="اسم المشروع" id="project" placeholder="مثال: باديا" />
        </div>
        <Field label="إجمالي سعر الوحدة" id="total-price" placeholder="اكتب السعر بالجنيه المصري" helper="10 مليون ج.م" />
        <label className="flex items-start gap-3 text-sm text-muted-foreground"><Checkbox className="mt-0.5" />أقر أنني مالك الوحدة أو مفوض عنها، وأوافق على شروط الاستخدام.</label>
      </FormSection>
      <div className="border-t border-dashed border-border" />
      <FormSection title="تفضيلات الأقساط">
        <Field label="أقصى قسط يريحك" id="comfortable-installment" placeholder="مثال: 35,000 ج.م" />
        <fieldset className="flex flex-col gap-3"><legend className="text-sm font-medium">طريقة السداد</legend><RadioGroup defaultValue="monthly" className="flex flex-wrap gap-6"><RadioOption value="monthly" label="شهري" /><RadioOption value="quarterly" label="ربع سنوي" /><RadioOption value="yearly" label="سنوي" /></RadioGroup></fieldset>
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-4"><Label htmlFor="overdue" className="text-sm font-medium">عليك أقساط متأخرة؟</Label><Switch id="overdue" /></div>
      </FormSection>
      <div className="border-t border-dashed border-border" />
      <FormSection title="تأكيد رقم الموبايل">
        <p className="text-sm text-muted-foreground">اكتب الكود المكوّن من 6 أرقام اللي وصلك على موبايلك.</p><InputOTP maxLength={6} dir="ltr"><InputOTPGroup className="mx-0"><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP><TurnstileBox />
      </FormSection>
    </div>
  </FunnelShell>
}

function Field({ label, id, placeholder, helper }: { label: string; id: string; placeholder: string; helper?: string }) { return <div className="flex flex-col gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} placeholder={placeholder} />{helper && <span className="text-xs font-medium text-emerald-700">{helper}</span>}</div> }
function RadioOption({ value, label }: { value: string; label: string }) { return <label className="flex items-center gap-2 text-sm"><RadioGroupItem value={value} />{label}</label> }

function _TurnstileNote() { return <TurnstileBox /> }
