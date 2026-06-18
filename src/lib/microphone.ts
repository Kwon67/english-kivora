export function getMicrophoneErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return 'Não consegui iniciar o microfone. Tente novamente.'
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return `Microfone bloqueado. ${getMicrophonePermissionHelpMessage()}`
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'Nenhum microfone foi encontrado neste dispositivo.'
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'O microfone está indisponível ou em uso por outro aplicativo.'
  }

  if (error.name === 'NotSupportedError') {
    return 'Este navegador não permite capturar áudio do microfone.'
  }

  return 'Não consegui acessar o microfone. Tente novamente.'
}

export function getMicrophonePermissionHelpMessage() {
  return 'No app instalado (PWA), abra o menu do navegador → Configurações do site → Microfone → Permitir. Se a opção não aparecer, toque no microfone novamente para o sistema pedir acesso.'
}

const PREWARM_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

let prewarmedStream: MediaStream | null = null
let prewarmPromise: Promise<MediaStream | null> | null = null

export function isPrewarmedMicrophoneActive() {
  return Boolean(prewarmedStream?.active)
}

export async function prewarmMicrophone(): Promise<MediaStream | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null
  }

  if (prewarmedStream?.active) {
    return prewarmedStream
  }

  if (prewarmPromise) {
    return prewarmPromise
  }

  prewarmPromise = navigator.mediaDevices
    .getUserMedia({ audio: PREWARM_AUDIO_CONSTRAINTS })
    .then((stream) => {
      prewarmedStream = stream
      return stream
    })
    .catch(() => null)
    .finally(() => {
      prewarmPromise = null
    })

  return prewarmPromise
}

export function consumePrewarmedMicrophoneStream(): MediaStream | null {
  if (!prewarmedStream?.active) {
    prewarmedStream = null
    return null
  }

  const stream = prewarmedStream
  prewarmedStream = null
  return stream
}

export function releasePrewarmedMicrophone() {
  prewarmedStream?.getTracks().forEach((track) => track.stop())
  prewarmedStream = null
  prewarmPromise = null
}

export async function requestMicrophoneAccess() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException('Microfone não suportado neste navegador.', 'NotSupportedError')
  }

  // Release any held stream so Web Speech / MediaRecorder can capture cleanly.
  releasePrewarmedMicrophone()

  const stream = await navigator.mediaDevices.getUserMedia({ audio: PREWARM_AUDIO_CONSTRAINTS })
  stream.getTracks().forEach((track) => track.stop())
}