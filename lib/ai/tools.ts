import { openai } from '@ai-sdk/openai'

export const tools = {
    web_search_preview: openai.tools.webSearchPreview({
      searchContextSize: 'high',
      userLocation: {
        type: 'approximate',
        country: 'GB' // TODO: Get proper location, slack doesn't support IP's or what not, so probably best to get location from a user input
      },
    }),
}