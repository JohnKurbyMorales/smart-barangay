import { openai } from './openai'

export interface ClassificationResult {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  priority: 'low' | 'medium' | 'high' | 'critical'
  suggested_department: string
  keywords: string[]
  summary: string
}

// Rule-based fallback classification when AI is unavailable
function classifyByKeywords(title: string, description: string): ClassificationResult {
  const text = `${title} ${description}`.toLowerCase()

  const rules: Array<{
    keywords: string[]
    result: ClassificationResult
  }> = [
    {
      keywords: ['sunog', 'fire', 'apoy', 'nasusunog', 'burning', 'smoke', 'usok'],
      result: {
        category: 'Fire',
        severity: 'critical',
        priority: 'critical',
        suggested_department: 'Bureau of Fire Protection',
        keywords: ['fire', 'emergency', 'burning'],
        summary: 'Fire incident reported. Immediate BFP response required.'
      }
    },
    {
      keywords: ['baha', 'flood', 'tubig', 'inundated', 'flooding', 'overflow', 'umaapaw'],
      result: {
        category: 'Flood',
        severity: 'high',
        priority: 'high',
        suggested_department: 'DRRMO',
        keywords: ['flood', 'water', 'disaster'],
        summary: 'Flooding incident reported. DRRMO intervention may be needed.'
      }
    },
    {
      keywords: ['aksidente', 'accident', 'nasagasaan', 'collision', 'crash', 'banggaan', 'hit'],
      result: {
        category: 'Accident',
        severity: 'high',
        priority: 'high',
        suggested_department: 'PNP / EMS',
        keywords: ['accident', 'collision', 'emergency'],
        summary: 'Vehicular or physical accident reported. PNP and EMS response needed.'
      }
    },
    {
      keywords: ['nakawan', 'theft', 'robbery', 'nanakaw', 'holdap', 'holdap', 'snatcher', 'ninakaw'],
      result: {
        category: 'Theft',
        severity: 'high',
        priority: 'high',
        suggested_department: 'PNP',
        keywords: ['theft', 'robbery', 'crime'],
        summary: 'Theft or robbery incident reported. PNP investigation required.'
      }
    },
    {
      keywords: ['away', 'away', 'gulo', 'disturbance', 'noise', 'ingay', 'maingay', 'nag-aaway', 'fight', 'brawl'],
      result: {
        category: 'Public Disturbance',
        severity: 'medium',
        priority: 'medium',
        suggested_department: 'Barangay Tanod',
        keywords: ['disturbance', 'noise', 'peace'],
        summary: 'Public disturbance reported. Barangay Tanod response recommended.'
      }
    },
    {
      keywords: ['medical', 'ambulance', 'injured', 'sugatan', 'patay', 'dead', 'seizure', 'heart attack', 'stroke', 'unconscious', 'hindi gumagalaw'],
      result: {
        category: 'Medical Emergency',
        severity: 'critical',
        priority: 'critical',
        suggested_department: 'EMS / Rescue',
        keywords: ['medical', 'emergency', 'rescue'],
        summary: 'Medical emergency reported. Immediate EMS response required.'
      }
    },
    {
      keywords: ['kalsada', 'road', 'pothole', 'butas', 'street light', 'ilaw', 'canal', 'drainage', 'basura', 'garbage'],
      result: {
        category: 'Infrastructure',
        severity: 'low',
        priority: 'low',
        suggested_department: 'DPWH / Barangay Engineering',
        keywords: ['infrastructure', 'road', 'maintenance'],
        summary: 'Infrastructure issue reported. Barangay engineering team should assess.'
      }
    },
    {
      keywords: ['noise', 'ingay', 'videoke', 'music', 'loud', 'malakas', 'maingay', 'sound'],
      result: {
        category: 'Noise Complaint',
        severity: 'low',
        priority: 'low',
        suggested_department: 'Barangay Tanod',
        keywords: ['noise', 'complaint', 'disturbing'],
        summary: 'Noise complaint filed. Barangay Tanod will be dispatched.'
      }
    }
  ]

  for (const rule of rules) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.result
    }
  }

  // Default fallback
  return {
    category: 'Other',
    severity: 'low',
    priority: 'low',
    suggested_department: 'Barangay Office',
    keywords: ['incident', 'report', 'barangay'],
    summary: 'General incident report submitted. Barangay staff will review and respond.'
  }
}

export async function classifyIncident(title: string, description: string): Promise<ClassificationResult> {
  // Check if OpenAI API key exists
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using keyword-based classification')
    return classifyByKeywords(title, description)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a Philippine Barangay Incident Reporting System.
Analyze the incident and classify it. Return ONLY valid JSON with these fields:
- category: one of ["Fire", "Flood", "Accident", "Theft", "Public Disturbance", "Medical Emergency", "Infrastructure", "Noise Complaint", "Other"]
- severity: one of ["low", "medium", "high", "critical"]
- priority: one of ["low", "medium", "high", "critical"]
- suggested_department: the relevant department (e.g., "Bureau of Fire Protection", "PNP", "DRRMO", "Barangay Tanod", "EMS / Rescue")
- keywords: array of 3-5 relevant keywords
- summary: 1-2 sentence summary of the incident

Guidelines:
- Fire/Medical Emergency = critical severity, critical priority
- Theft/Accident = high severity, high priority
- Noise/Infrastructure = low severity, low priority
- Use Filipino barangay context`
        },
        {
          role: 'user',
          content: `Title: ${title || 'No title'}\nDescription: ${description}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Empty response from OpenAI')

    const result = JSON.parse(content)
    if (!result.category || !result.severity || !result.priority) {
      throw new Error('Invalid response structure')
    }

    return {
      category: result.category || 'Other',
      severity: result.severity || 'low',
      priority: result.priority || 'low',
      suggested_department: result.suggested_department || 'Barangay Office',
      keywords: Array.isArray(result.keywords) ? result.keywords : ['incident'],
      summary: result.summary || 'Incident report requiring attention.'
    }

  } catch (error: any) {
    console.error('AI classification error:', error?.message)
    // Fall back to keyword-based classification
    return classifyByKeywords(title, description)
  }
}
