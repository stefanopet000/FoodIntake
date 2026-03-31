const Anthropic = require('@anthropic-ai/sdk')
const OpenAI    = require('openai')

const claudeSystem = 'You are a nutrition and weight loss expert in a peer review with a colleague. Be specific, reference actual foods and quantities, and keep responses focused (200–300 words).'
const openaiSystem = 'You are a nutrition and weight loss expert in a peer review with a colleague. Be specific, reference actual foods and quantities, and keep responses focused (200–300 words).'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { data, basePrompt, step, dialog = [] } = JSON.parse(event.body)

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
    const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const entries    = (data || []).slice(0, 100)
    const dataJson   = JSON.stringify(entries, null, 2)
    const sharedContext = `${basePrompt}\n\nFood intake data (${entries.length} entries):\n${dataJson}`

    const c1 = dialog.find(d => d.speaker === 'Claude' && dialog.indexOf(d) === 0)?.content
    const o2 = dialog.find(d => d.speaker === 'ChatGPT')?.content
    const c3 = dialog.filter(d => d.speaker === 'Claude')[1]?.content
    const o4 = dialog.filter(d => d.speaker === 'ChatGPT')[1]?.content

    let message

    if (step === 1) {
      // Claude opens
      const r = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 600,
        system: claudeSystem,
        messages: [{
          role: 'user',
          content: `${sharedContext}\n\nProvide your initial assessment of this diet. Highlight 3–4 key insights relevant to weight loss and health. Be specific.`,
        }],
      })
      message = { speaker: 'Claude', content: r.content[0].text }

    } else if (step === 2) {
      // ChatGPT reviews Claude's opening
      const r = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 600,
        messages: [
          { role: 'system', content: openaiSystem },
          { role: 'user', content: `${sharedContext}\n\nYour colleague Claude analyzed this diet and said:\n\n${c1}\n\nReview their points. What do you agree with? What would you add or challenge? Reference specific data.` },
        ],
      })
      message = { speaker: 'ChatGPT', content: r.choices[0].message.content }

    } else if (step === 3) {
      // Claude responds to ChatGPT
      const r = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 600,
        system: claudeSystem,
        messages: [
          { role: 'user',      content: `${sharedContext}\n\nYour initial assessment:\n${c1}` },
          { role: 'assistant', content: c1 },
          { role: 'user',      content: `ChatGPT reviewed your analysis and said:\n\n${o2}\n\nRespond to the most important points. Where do you agree or see it differently?` },
        ],
      })
      message = { speaker: 'Claude', content: r.content[0].text }

    } else if (step === 4) {
      // ChatGPT final observations
      const r = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 600,
        messages: [
          { role: 'system',    content: openaiSystem },
          { role: 'user',      content: `${sharedContext}\n\nClaude's opening:\n${c1}` },
          { role: 'assistant', content: o2 },
          { role: 'user',      content: `Claude responded:\n\n${c3}\n\nAny final observations before we wrap up? Focus on what's most actionable.` },
        ],
      })
      message = { speaker: 'ChatGPT', content: r.choices[0].message.content }

    } else if (step === 5) {
      // Claude synthesizes joint conclusion
      const r = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 900,
        system: 'You are a nutrition expert synthesizing a peer discussion into clear, actionable conclusions.',
        messages: [{
          role: 'user',
          content: `Two nutrition experts reviewed this food data and had the following discussion:\n\nClaude: ${c1}\n\nChatGPT: ${o2}\n\nClaude: ${c3}\n\nChatGPT: ${o4}\n\nSynthesize the agreed conclusions into:\n1. **Overall assessment** — one short paragraph\n2. **Top recommendations** — 3–5 specific, actionable steps for weight loss and health (bullet points)\n3. **Priority this week** — the single most impactful change to make right now\n\nBe direct and practical.`,
        }],
      })
      message = { speaker: 'Conclusion', content: r.content[0].text }

    } else {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid step (1–5)' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, done: step === 5 }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
