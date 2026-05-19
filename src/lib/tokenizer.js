import { countTokens as _countTokens } from '@anthropic-ai/tokenizer';

export function countTokens(text) {
  return _countTokens(text ?? '');
}
