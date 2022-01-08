export function playSound(src: string) {
  const sound = new Audio(`sounds/${src}.flac`)
  sound.volume = 0.05
  sound.play()
}