'use client'

import { type ReactNode, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export interface TabItem {
  value: string
  label: string
  content: ReactNode
  disabled?: boolean
}

interface GenericTabsProps {
  tabs: TabItem[]
  defaultTab?: string
  onTabChange?: (value: string) => void
  syncUrl?: boolean        // if true, syncs to ?tab= searchParam
  paramName?: string       // default: 'tab'
  className?: string
}

export function GenericTabs({
  tabs,
  defaultTab,
  onTabChange,
  syncUrl = false,
  paramName = 'tab',
  className,
}: GenericTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = syncUrl
    ? (searchParams.get(paramName) ?? defaultTab ?? tabs[0]?.value)
    : (defaultTab ?? tabs[0]?.value)

  const handleTabChange = useCallback(
    (value: string) => {
      onTabChange?.(value)
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString())
        params.set(paramName, value)
        router.push(`?${params.toString()}`, { scroll: false })
      }
    },
    [syncUrl, paramName, router, searchParams, onTabChange]
  )

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
