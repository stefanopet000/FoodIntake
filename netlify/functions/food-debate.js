const Anthropic = require('@anthropic-ai/sdk')
const OpenAI    = require('openai')

// Orchestrates a 5-round dialog between Claude and ChatGPT on food intake data,
// ending with a joint conclusion synthesized by Claude.
exports.handler = async (event) => {
  try {
    const { data, basePrompt } = JSON.parse(event.body)

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
    const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Cap data at 100 entries to keep context manageable
    const entries  = (data || []).slice(0, 100)
    const dataJson = JSON.stringify(entries, null, 2)

    const sharedContext = `${basePrompt}

Food intake data (${entries.length} entries):
${dataJson}`

    const claudeSystem = 'You are a nutrition and weight loss expert in a peer review with a colleague. Be specific, reference actual foods and quantities, and keep responses focused (200–300 words).'
    const openaiSystem = 'You are a nutrition and weight loss expert in a peer review with a colleague. Be specific, reference actual foods and quantities, and keep responses focused (200–300 words).'

    const dialog = []

    // ── Round 1: Claude opens ──────────────────────────────────────────────────
    const r1 = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 600,
      system: claudeSystem,
      messages: [{
        role: 'user',
        content: `${sharedContext}\n\nProvide your initial assessment of this diet. Highlight 3–4 key insights relevant to weight loss and health. Be specific.`,
      }],
    })
    const c1 = r1.content[0].text
    dialog.push({ speaker: 'Claude', content: c1 })

    // ── Round 2: ChatGPT reviews ───────────────────────────────────────────────
    const r2 = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [
        { role: 'system', content: openaiSystem },
        { role: 'user', content: `${sharedContext}\n\nYour colleague Claude analyzed this diet and said:\n\n${c1}\n\nReview their points. What do you agree with? What would you add or challenge? Reference specific data.` },
      ],
    })
    const o2 = r2.choices[0].message.content
    dialog.push({ speaker: 'ChatGPT', content: o2 })

    // ── Round 3: Claude responds ───────────────────────────────────────────────
    const r3 = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 600,
      system: claudeSystem,
      messages: [
        { role: 'user',      content: `${sharedContext}\n\nYour initial assessment:\n${c1}` },
        { role: 'assistant', content: c1 },
        { role: 'user',      content: `ChatGPT reviewed your analysis and said:\n\n${o2}\n\nRespond to the most important points. Where do you agree or see it differently?` },
      ],
    })
    const c3 = r3.content[0].text
    dialog.push({ speaker: 'Claude', content: c3 })

    // ── Round 4: ChatGPT final observations ───────────────────────────────────
    const r4 = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [
        { role: 'system',    content: openaiSystem },
        { role: 'user',      content: `${sharedContext}\n\nClaude's opening:\n${c1}` },
        { role: 'assistant', content: o2 },
        { role: 'user',      content: `Claude responded:\n\n${c3}\n\nAny final observations before we wrap up? Focus on what's most actionable.` },
      ],
    })
    const o4 = r4.choices[0].message.content
    dialog.push({ speaker: 'ChatGPT', content: o4 })

    // ── Round 5: Joint conclusion (Claude synthesizes) ─────────────────────────
    const r5 = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 900,
      system: 'You are a nutrition expert synthesizing a peer discussion into clear, actionable conclusions.',
      messages: [{
        role: 'user',
        content: `Two nutrition experts reviewed this food data and had the following discussion:

Claude: ${c1}

ChatGPT: ${o2}

Claude: ${c3}

ChatGPT: ${o4}

Synthesize the agreed conclusions into:
1. **Overall assessment** — one short paragraph
2. **Top recommendations** — 3–5 specific, actionable steps for weight loss and health (bullet points)
3. **Priority this week** — the single most impactful change to make right now

Be direct and practical.`,
      }],
    })
    const conclusion = r5.content[0].text
    dialog.push({ speaker: 'Conclusion', content: conclusion })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialog }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
