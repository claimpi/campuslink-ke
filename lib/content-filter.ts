// Patterns to detect contact/payment sharing attempts
const BLOCKED_PATTERNS = [
  // Phone numbers (Kenyan and international)
  /(\+?254|0)[17]\d{8}/g,
  /(\+?254|0)[17]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}/g,
  /\b0[17]\d{8}\b/g,
  // WhatsApp hints
  /whatsapp|whats\s*app|wa\.me|chat\s*on\s*wa/gi,
  // Telegram
  /telegram|t\.me\//gi,
  // Instagram/Snapchat/TikTok handles
  /my\s*(ig|insta|snap|tiktok|twitter|fb|facebook)\s*is/gi,
  /follow\s*me\s*on/gi,
  /add\s*me\s*on/gi,
  /find\s*me\s*(on|at)/gi,
  /dm\s*me\s*(on|at)/gi,
  // Bank account numbers
  /\b\d{10,16}\b/g, // long digit strings (account numbers)
  /paybill|till\s*no|till\s*number|lipa\s*na\s*mpesa/gi,
  /account\s*(no|number|#)/gi,
  /send\s*(me\s*)?(money|cash|ksh|kes)/gi,
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Explicit sharing language
  /my\s*number\s*is/gi,
  /call\s*me\s*(on|at)?/gi,
  /text\s*me\s*(on|at)?/gi,
  /reach\s*me\s*(on|at)?/gi,
  /contact\s*me\s*(on|at)?/gi,
  /hit\s*me\s*up/gi,
]

export function detectViolation(text: string): { blocked: boolean; reason: string } {
  const lower = text.toLowerCase()

  for (const pattern of BLOCKED_PATTERNS) {
    pattern.lastIndex = 0 // reset regex state
    if (pattern.test(text)) {
      // Determine reason
      if (/(\+?254|0)[17]/.test(text) || /\b0[17]\d{8}\b/.test(text)) {
        return { blocked: true, reason: 'phone_number' }
      }
      if (/whatsapp|wa\.me/i.test(text)) {
        return { blocked: true, reason: 'whatsapp' }
      }
      if (/telegram|t\.me/i.test(text)) {
        return { blocked: true, reason: 'telegram' }
      }
      if (/\b\d{10,16}\b/.test(text) || /paybill|till\s*no|account\s*(no|number)/i.test(text)) {
        return { blocked: true, reason: 'account_number' }
      }
      if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
        return { blocked: true, reason: 'email' }
      }
      if (/instagram|snapchat|tiktok|twitter|facebook/i.test(text)) {
        return { blocked: true, reason: 'social_media' }
      }
      return { blocked: true, reason: 'contact_sharing' }
    }
  }
  return { blocked: false, reason: '' }
}

export const VIOLATION_MESSAGES: Record<string, string> = {
  phone_number: 'Sharing phone numbers is not allowed in chat. Use the app to connect safely.',
  whatsapp: 'Moving to WhatsApp defeats the purpose of safe chatting. Stay on CampusLink KE!',
  telegram: 'Sharing Telegram contacts is not allowed. Keep your conversations safe here.',
  account_number: 'Sharing bank account numbers or M-Pesa details is not allowed. Use our built-in coin transfer instead.',
  email: 'Sharing email addresses is not allowed in chat.',
  social_media: 'Sharing social media handles is not allowed. Get to know each other here first!',
  contact_sharing: 'Sharing personal contact details is not allowed to keep everyone safe.',
}
