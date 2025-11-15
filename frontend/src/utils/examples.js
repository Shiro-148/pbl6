const NEXT_SENTENCE_REGEX = /\.\s+(?=(?:\d+\.\s*)?[A-ZÀ-Ỵ])/gu;

const forceArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return [trimmed];
  }
  const str = String(value).trim();
  return str ? [str] : [];
};

export const splitExamples = (value) => {
  if (value === null || value === undefined) return [];

  const flat = [];
  const queue = forceArray(value);
  while (queue.length) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    let text = String(current || '').replace(/\r\n/g, '\n').trim();
    if (!text) continue;

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        queue.push(...parsed);
        continue;
      }
    } catch {
      // not json, continue
    }

    const newlineParts = text.split(/\n+/).map((part) => part.trim()).filter(Boolean);
    if (newlineParts.length > 1) {
      queue.push(...newlineParts);
      continue;
    }

    const sentenceParts = [];
    let lastIndex = 0;
    let match;
    while ((match = NEXT_SENTENCE_REGEX.exec(text)) !== null) {
      const splitIndex = match.index + 1; // include the period
      const chunk = text.slice(lastIndex, splitIndex).trim();
      if (chunk) sentenceParts.push(chunk);
      lastIndex = splitIndex + match[0].length - 1;
    }
    const tail = text.slice(lastIndex).trim();
    if (tail) sentenceParts.push(tail);
    NEXT_SENTENCE_REGEX.lastIndex = 0;
    if (sentenceParts.length > 1) {
      queue.push(...sentenceParts);
      continue;
    }

    flat.push(text);
  }

  return flat;
};

export const joinExamples = (value) => splitExamples(value).join('\n');
