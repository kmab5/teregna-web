import { getLocale, getMessages } from "./index";
import { createTranslator, type Translator } from "./translate";

/** The translator, for server components and route handlers. */
export async function getT(): Promise<Translator> {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return createTranslator(locale, messages);
}
export { getLocale, getMessages };
