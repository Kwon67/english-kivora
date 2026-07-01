import { toast, type ExternalToast } from 'sonner'

type NotifyOptions = Pick<ExternalToast, 'description'>

export const notify = {
  success: (msg: string, options?: NotifyOptions) => toast.success(msg, options),
  error: (msg: string, options?: NotifyOptions) => toast.error(msg, options),
  loading: (msg: string, options?: NotifyOptions) => toast.loading(msg, options),
  dismiss: () => toast.dismiss(),
}
