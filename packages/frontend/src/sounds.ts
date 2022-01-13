export function playSound(src: string) {
  console.log('playSound', src)
  const sound = new Audio(`sounds/${src}.flac`)
  sound.volume = 0.05
  sound.addEventListener('canplaythrough', async () => {
    await sound.play()
  })
}
