import { openai } from './openai'

const BARANGAY_FAQ: Record<string, string> = {
  'report': 'To file an incident report, click "Report Incident" in the sidebar. Fill in the title, description, location, and optionally use AI to classify it automatically.',
  'status': 'You can track your report status in "My Reports". Statuses are: Pending → AI Reviewing → Verified → Assigned → In Progress → Resolved.',
  'emergency': 'For emergencies, call 911 immediately. For barangay emergencies, call your local barangay emergency hotline. Do not rely on this system for emergency dispatch.',
  'anonymous': 'Yes! You can submit anonymous reports by toggling the "Anonymous Report" switch when submitting.',
  'photo': 'Yes, you can attach photos to your incident report. Click the upload section in the report form.',
  'location': 'You can pin your incident location on the map, use "Use My Location" button, or type the address manually.',
  'contact': 'Contact the barangay office during office hours: Mon-Fri, 8:00 AM - 5:00 PM.',
  'login': 'Use your registered email and password to log in at the login page. If you forgot your password, use the "Forgot Password" link.',
  'register': 'Click "Get Started" or "Register" on the homepage. Fill in your name, email, and password to create an account.',
  'category': 'Incident categories include: Fire, Flood, Accident, Theft, Public Disturbance, Medical Emergency, Infrastructure, and Noise Complaint.',
}

function getKeywordResponse(message: string): string | null {
  const msg = message.toLowerCase()
  
  for (const [keyword, response] of Object.entries(BARANGAY_FAQ)) {
    if (msg.includes(keyword)) {
      return response
    }
  }
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('kumusta')) {
    return 'Hello! I\'m the SMART-Barangay assistant. I can help you with filing reports, checking report status, and answering questions about barangay services. How can I help you today?'
  }
  
  if (msg.includes('salamat') || msg.includes('thank')) {
    return 'You\'re welcome! If you need anything else, feel free to ask. Stay safe!'
  }
  
  return null
}

export async function getChatResponse(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  // Try OpenAI first if key exists
  if (process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for SMART-Barangay, a Philippine Barangay Incident Reporting System.
You help residents with:
- How to file incident reports
- Barangay services and requirements
- Emergency contacts and procedures
- Understanding incident statuses
- General barangay inquiries
Keep responses concise, helpful, and friendly. Reply in the same language the user uses (Filipino or English).
If asked about specific incidents or personal data, explain you don't have access to that information.`
          },
          ...history.slice(-6), // Keep last 6 messages for context
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 400,
      })

      return completion.choices[0].message.content || getKeywordResponse(message) || 
        'I\'m here to help! Could you please rephrase your question about barangay services?'

    } catch (error: any) {
      console.error('OpenAI chat error:', error?.message)
      // Fall through to keyword-based response
    }
  }

  // Keyword-based fallback response
  const keywordResponse = getKeywordResponse(message)
  if (keywordResponse) return keywordResponse

  return `I can help you with the following topics:
  
• 📝 **Filing a report** - How to submit an incident report
• 📊 **Report status** - Understanding your report's progress  
• 🚨 **Emergency contacts** - Who to call in emergencies
• 📍 **Location** - How to pin your incident location
• 👤 **Account** - Login, registration, and profile

Please ask me about any of these topics!`
}
