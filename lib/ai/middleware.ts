import type { LanguageModelV1Middleware } from 'ai';

export const jsonRepairMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate }) => {
    const {text, ...rest} = await doGenerate();

    const repairedText = text?.replace(`\n`, `\\n`);

    if (text !== repairedText) {
      console.log('🧩 text', JSON.stringify(text, null, 2))
      console.log('🧩 repairedText', JSON.stringify(repairedText, null, 2))
    }

    return { text: repairedText, ...rest };
  }
}
