'use client'
import RouteFailure from '@/components/ui/RouteFailure'
export default function DashboardError({ retry }: { retry: () => void }) {
  return <RouteFailure reset={retry} />
}
