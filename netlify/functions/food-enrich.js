const Anthropic = require('@anthropic-ai/sdk')

exports.handler = async (event) => {
  try {
    const { entries, mode } = JSON.parse(event.body)
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

    let prompt
    if (mode === 'text') {
      const e = entries[0]
      prompt = `Parse this food description for ${e.meal_type} on ${e.date} into individual food items, then enrich each with nutritional data.

Food description: "${e.text}"

Return a JSON array where each element represents one distinct food item and includes:
- food_name_raw: the relevant portion of the original text for this item
- food_name_normalized: standardized snake_case name (e.g. "chicken_breast_grilled")
- quantity: numeric amount
- unit: one of [g, ml, piece, cup, tsp, tbsp, serving, slice, bowl]
- grams_estimated: estimated total weight in grams
- brand: brand name if mentioned, otherwise null
- preparation: one of [raw, fried, grilled, boiled, baked, air_fried, plain, prepared, mixed, packaged] or null
- category_primary: one of [protein, carb, fat, dairy, fruit, vegetable, drink, mixed, processed]
- category_secondary: more specific subcategory string
- kcal: total calories for the given quantity (number)
- protein_g: grams of protein (number)
- carbs_g: grams of carbohydrates (number)
- fat_g: grams of fat (number)
- fiber_g: grams of dietary fiber (number)
- source_type: one of [database, label, user_estimate, recipe_estimate]
- confidence: one of [high, medium, low]
- notes: brief note on estimation method or assumptions
- clarification_needed: true if the food is too ambiguous to estimate accurately
- clarification_question: the question to ask the user if clarification_needed, otherwise null

Use standard nutritional databases (USDA, common food tables). Calculate all macros for the actual quantity given, not per 100g.

IMPORTANT: Respond with ONLY a raw JSON array. No markdown, no code blocks, no explanation.`
    } else {
      // form or re-enrich mode
      prompt = `Enrich these food entries with complete nutritional data.

Entries:
${JSON.stringify(entries, null, 2)}

For each entry return all original fields plus:
- food_name_normalized: standardized snake_case name
- grams_estimated: estimated total weight in grams
- category_primary: one of [protein, carb, fat, dairy, fruit, vegetable, drink, mixed, processed]
- category_secondary: more specific subcategory string
- kcal: total calories for the given quantity (number, not per 100g)
- protein_g: grams of protein for the given quantity
- carbs_g: grams of carbohydrates for the given quantity
- fat_g: grams of fat for the given quantity
- fiber_g: grams of dietary fiber for the given quantity
- source_type: one of [database, label, user_estimate, recipe_estimate]
- confidence: one of [high, medium, low]
- notes: brief note on estimation method
- clarification_needed: true if the food identity or quantity is too ambiguous for an accurate estimate
- clarification_question: the question to ask the user if clarification_needed, otherwise null

Preserve all original fields (food_name_raw, quantity, unit, brand, preparation) exactly as provided.

IMPORTANT: Respond with ONLY a raw JSON array. No markdown, no code blocks, no explanation.`
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    let text = message.content[0].text.trim()
    // Strip markdown code blocks if the model wraps the response anyway
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    const result = JSON.parse(text)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: result }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
