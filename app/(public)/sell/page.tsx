import type { Metadata } from 'next'
import { SellerFlow } from '@/components/features/seller/seller-flow'
import { getServerI18n } from '@/lib/get-server-dictionary'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getServerI18n()
  return {
    title: dict.sell?.metaTitle || 'Aqar Exit',
    description: dict.sell?.metaDesc || '',
  }
}

export default function SellPage() {
  return <SellerFlow />
}