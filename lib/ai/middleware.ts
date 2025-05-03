import type { LanguageModelV1Middleware } from 'ai';

export const jsonRepairMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate }) => {
    const {text, ...rest} = await doGenerate();

    console.log('🧩 text', JSON.stringify(text, null, 2))
    console.log('🧩 rest', JSON.stringify(rest, null, 2))

    return { text: text, ...rest };
  }
}
