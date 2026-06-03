// Native Android bridge — safe to call on web (no-ops if not in Capacitor)

let isNative = false

if (typeof window !== 'undefined') {
  import('@capacitor/core').then(({ Capacitor }) => {
    isNative = Capacitor.isNativePlatform()
  }).catch(() => {})
}

export async function hapticLight() {
  if (!isNative) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {}
}

export async function hapticMedium() {
  if (!isNative) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch {}
}

export async function hapticSuccess() {
  if (!isNative) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Success })
  } catch {}
}

export async function setStatusBarOrange() {
  if (!isNative) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#f97316' })
  } catch {}
}

export async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (isNative) {
      const { Geolocation } = await import('@capacitor/geolocation')
      const pos = await Geolocation.getCurrentPosition({ timeout: 10000 })
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } else {
      return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return }
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 10000 }
        )
      })
    }
  } catch {
    return null
  }
}

export async function takePicture(): Promise<string | null> {
  if (!isNative) return null
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
    })
    return image.dataUrl || null
  } catch {
    return null
  }
}
