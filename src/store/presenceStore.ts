import { create } from 'zustand'

export type PresenceStatus = 'idle' | 'connecting' | 'live' | 'signed_out'

interface PresenceState {
  onlineUserIds: string[]
  status: PresenceStatus
}

export const usePresenceStore = create<PresenceState>(() => ({
  onlineUserIds: [],
  status: 'idle',
}))

export function setPresenceStatus(status: PresenceStatus) {
  usePresenceStore.setState({ status })
}

export function setPresenceOnlineUserIds(onlineUserIds: string[]) {
  usePresenceStore.setState({
    onlineUserIds: Array.from(new Set(onlineUserIds)).sort(),
  })
}

export function resetPresenceStore(status: PresenceStatus = 'idle') {
  usePresenceStore.setState({
    onlineUserIds: [],
    status,
  })
}
