'use client'
import RouteFailure from '@/components/ui/RouteFailure'
export default function AdminError({ retry }: { retry: () => void }) {
  return <RouteFailure reset={retry} admin />
}
