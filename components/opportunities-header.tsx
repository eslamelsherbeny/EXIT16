import { Button } from "@/components/ui/button"

export function OpportunitiesHeader() {
  return (
    <div className="mb-8 w-full">
      <h1 className="mb-2 text-right text-3xl font-bold text-[#0a1128]">الفرص المتاحة — وحدات تنازل بدون أوفر</h1>
      <p className="mb-6 text-right text-gray-500">كل فرصة هنا اتراجع عقدها وإيصالاتها ورصيدها المتبقي قبل ما تظهر. مفيش أوفر، ومفيش أرقام على كلام حد.</p>
      <div className="mb-8 flex flex-col items-center justify-around divide-y rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:divide-x md:divide-x-reverse md:divide-y-0">
        <div className="w-full px-8 py-4 text-center md:py-0">
          <p className="mb-1 text-sm font-medium text-gray-500">الوحدات على المنصة</p>
          <p className="mb-1 text-4xl font-bold text-[#0a1128]">9,426 <span className="text-lg font-normal text-gray-500">وحدة</span></p>
          <p className="text-xs text-gray-400">منشورة في السوق، وتحت المراجعة</p>
        </div>
        <div className="w-full px-8 py-4 text-center md:py-0">
          <p className="mb-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-500">قيمة الوحدات في السوق <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">تقديري</span></p>
          <p className="mb-1 text-4xl font-bold text-[#0a1128]">135.6 <span className="text-lg font-normal text-gray-500">مليار ج.م</span></p>
          <p className="text-xs text-gray-400">بسعر السوق الحالي للوحدة</p>
        </div>
      </div>
    </div>
  )
}
