export async function analyzeWithClaude(data, prompt) {
  const res = await fetch('/.netlify/functions/claude-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, prompt }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Claude API error')
  }
  return res.json()
}

export async function analyzeWithOpenAI(data, prompt) {
  const res = await fetch('/.netlify/functions/openai-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, prompt }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'OpenAI API error')
  }
  return res.json()
}

export const DEFAULT_PROMPT = `You are a nutrition and fitness analyst. Analyze the food intake data below and provide:
1. Key trends and patterns observed
2. What is going well (strengths)
3. Areas of concern or improvement
4. Specific, actionable recommendations
5. A brief summary of overall progress

Be specific and data-driven. Reference actual numbers from the data.`
