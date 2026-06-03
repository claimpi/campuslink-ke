const BLOCKED = [
  /(\+?254|0)[17]\d{8}/g,
  /whatsapp|wa\.me/gi,
  /telegram|t\.me\//gi,
  /my\s*(ig|insta|snap|tiktok|twitter|fb)\s*is/gi,
  /\b\d{10,16}\b/g,
  /paybill|till\s*no|lipa\s*na\s*mpesa/gi,
  /account\s*(no|number|#)/gi,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /my\s*number\s*is/gi,
  /call\s*me|text\s*me|reach\s*me/gi,
]

export function detectViolation(text: string): { blocked: boolean; reason: string } {
  for (const p of BLOCKED) {
    p.lastIndex = 0
    if (p.test(text)) {
      if (/(\+?254|0)[17]\d{8}/.test(text)) return { blocked: true, reason: 'phone_number' }
      if (/whatsapp|wa\.me/i.test(text)) return { blocked: true, reason: 'whatsapp' }
      if (/\b\d{10,16}\b/.test(text)) return { blocked: true, reason: 'account_number' }
      if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return { blocked: true, reason: 'email' }
      return { blocked: true, reason: 'contact_sharing' }
    }
  }
  return { blocked: false, reason: '' }
}

export const VIOLATION_MESSAGES: Record<string, string> = {
  phone_number: 'Sharing phone numbers is not allowed. Use in-app chat to connect safely.',
  whatsapp: 'Stay on CampusLink KE to chat safely!',
  account_number: 'Sharing bank/M-Pesa details is not allowed. Use our coin transfer instead.',
  email: 'Sharing email addresses is not allowed in chat.',
  contact_sharing: 'Sharing personal contact details is not allowed.',
}
