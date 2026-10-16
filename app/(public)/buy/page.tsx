import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FunnelShell, FormSection } from '@/components/funnel-shell'

export const metadata = { title: 'شراء وحدة | دارك', description: 'اكتشف فرصاً عقارية بسعر التعاقد القديم مع دارك.' }

export default function BuyPage() {
  return <FunnelShell title="اشتري بسعر التعاقد القديم" benefits={['اختيارات بسعر التعاقد القديم', 'نتأكد من كل تفاصيل الوحدة', 'نساعدك لحد استلام المفتاح']} step="خطوة 1 من 3" totalSteps={3}>
    <div className="flex flex-col gap-10">
      <FormSection title="ميزانيتك">
        <div className="grid gap-5 sm:grid-cols-2"><Field label="الكاش المتاح" id="cash" placeholder="مثال: 1,000,000 ج.م" /><Field label="أقصى قسط" id="installment" placeholder="مثال: 25,000 ج.م" /></div><Field label="سعر التعاقد المستهدف" id="target-price" placeholder="مثال: 4,500,000 ج.م" />
      </FormSection>
      <div className="border-t border-dashed border-border" />
      <FormSection title="تفضيلاتك">
        <div className="flex flex-col gap-2"><Label>المناطق اللي تهمك</Label><div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2"><span className="rounded-full bg-[#e5eee8] px-3 py-1 text-xs font-medium text-primary">التجمع الخامس <span aria-hidden="true">×</span></span><span className="text-sm text-muted-foreground">أضف منطقة أخرى...</span></div></div>
        <fieldset className="flex flex-col gap-3"><legend className="text-sm font-medium">نوع الوحدة</legend><div className="flex flex-wrap gap-2"><button type="button" className="rounded-full border border-primary bg-primary px-5 py-2 text-sm text-primary-foreground">شقة</button><button type="button" className="rounded-full border border-border bg-background px-5 py-2 text-sm text-muted-foreground">دوبلكس</button><button type="button" className="rounded-full border border-border bg-background px-5 py-2 text-sm text-muted-foreground">فيلا</button></div></fieldset>
        <fieldset className="flex flex-col gap-3"><legend className="text-sm font-medium">حالة التسليم</legend><RadioGroup defaultValue="ready" className="flex gap-6"><label className="flex items-center gap-2 text-sm"><RadioGroupItem value="ready" />جاهزة</label><label className="flex items-center gap-2 text-sm"><RadioGroupItem value="under-construction" />تحت الإنشاء</label></RadioGroup></fieldset>
      </FormSection>
    </div>
  </FunnelShell>
}
function Field({ label, id, placeholder }: { label: string; id: string; placeholder: string }) { return <div className="flex flex-col gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={id} type={id === 'cash' || id === 'installment' || id === 'target-price' ? 'number' : 'text'} inputMode={id === 'cash' || id === 'installment' || id === 'target-price' ? 'numeric' : undefined} required placeholder={placeholder} /></div> }
