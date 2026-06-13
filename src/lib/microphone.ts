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

export async function requestMicrophoneAccess() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException('Microfone não suportado neste navegador.', 'NotSupportedError')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  stream.getTracks().forEach((track) => track.stop())
}