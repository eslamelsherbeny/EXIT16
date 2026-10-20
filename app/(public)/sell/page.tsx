import { SellerFlow } from '@/components/seller-flow'
import arDict from '@/dictionaries/ar.json'

export const metadata = {
  title: arDict.sell.metaTitle,
  description: arDict.sell.metaDesc,
}

export default function SellPage() {
  return <SellerFlow />
}
