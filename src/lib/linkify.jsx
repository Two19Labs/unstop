// Turns links inside chat text into clickable <a> elements.
// Builds React elements (never raw HTML), and only ever links to http(s).
import React from 'react';

// https://…, http://…, www.…, or a bare domain like two19labs.in / docs.google.com/x
const LINK_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"]+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|in|org|net|io|co|edu|gov|ai|app|dev|me|xyz|info|tech|so|gg|ly|link|site|online|store|page|gle|gl|be|to|tv|us|uk|ca|ac)(?![a-z0-9-])(?:\/[^\s<>"]*)?)/gi;
// Punctuation that usually ends a sentence rather than the link
const TRAILING = /[.,!?;:'")\]]+$/;

function toHref(raw) {
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch (e) {
    return null;
  }
}

export function renderLinkedText(text, linkClassName = 'chat-link') {
  if (!text) return text;
  const parts = [];
  let last = 0;
  let match;
  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    let raw = match[0];
    const trailing = raw.match(TRAILING);
    if (trailing) raw = raw.slice(0, -trailing[0].length);
    // Skip email addresses (the part before @ is not a link)
    if (match.index > 0 && text[match.index - 1] === '@') continue;
    const href = raw ? toHref(raw) : null;
    if (!href) continue;
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={`${match.index}-${raw}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={linkClassName}
        onClick={(e) => e.stopPropagation()}
      >
        {raw}
      </a>
    );
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}
