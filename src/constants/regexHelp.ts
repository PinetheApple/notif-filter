/**
 * Copy for the pattern help shown in the rule editor and on its own Settings page.
 * The behaviour notes describe RuleEngine.kt; keep them in step with it.
 */

/** Mirrors RuleEngine.MAX_CONTENT_LENGTH. */
export const MAX_MATCH_LENGTH = 4096;

export type HelpNote = {
  title: string;
  body: string;
};

export type HelpRow = {
  token: string;
  meaning: string;
};

export const REGEX_HELP_NOTES: readonly HelpNote[] = [
  {
    title: 'Patterns are searched, not matched end to end',
    body: 'A pattern hits when it is found anywhere in the text, so credit matches "Your credit card is due". You do not need to wrap it in .* to match the rest of the line.',
  },
  {
    title: 'Case sensitivity is the switch, not a flag',
    body: 'Turn on Case insensitive instead of writing (?i) in the pattern.',
  },
  {
    title: 'The match field decides what is searched',
    body: 'title searches the notification title, text searches its body, and any searches the title, body, sub text, big text, summary text, info text and text lines joined together with spaces. A pattern that misses on title can still hit on any.',
  },
  {
    title: `Only the first ${MAX_MATCH_LENGTH} characters are searched`,
    body: 'Longer notification content is cut off before matching, which keeps a slow pattern from stalling the filter.',
  },
  {
    title: 'This is Java regex, not JavaScript',
    body: 'Everyday syntax is the same, but patterns copied from a JavaScript reference may need adjusting. A pattern Java cannot compile is skipped, and the rule then never matches.',
  },
  {
    title: 'The tester ignores the match field',
    body: 'The pattern tester in the rule editor runs your pattern against the sample text on its own. It does not reproduce which field the rule will search.',
  },
];

export const REGEX_SYNTAX_ROWS: readonly HelpRow[] = [
  { token: 'a|b', meaning: 'Either a or b' },
  { token: '.', meaning: 'Any single character' },
  { token: '*', meaning: 'The item before it, zero or more times' },
  { token: '+', meaning: 'The item before it, one or more times' },
  { token: '?', meaning: 'The item before it, zero or one time' },
  { token: '{2,5}', meaning: 'The item before it, 2 to 5 times' },
  { token: '[abc]', meaning: 'Any one of a, b or c' },
  { token: '[^abc]', meaning: 'Any character except a, b or c' },
  { token: '\\d', meaning: 'Any digit' },
  { token: '\\w', meaning: 'Any letter, digit or underscore' },
  { token: '\\s', meaning: 'Any whitespace' },
  { token: '^', meaning: 'Start of the searched text' },
  { token: '$', meaning: 'End of the searched text' },
  { token: '\\b', meaning: 'A word boundary' },
  { token: '\\.', meaning: 'A literal dot. Escape . $ ^ * + ? ( ) [ ] { } | \\ the same way' },
];

export const REGEX_EXAMPLE_ROWS: readonly HelpRow[] = [
  { token: 'credit|sent', meaning: 'Either word appears anywhere' },
  { token: '^Payment', meaning: 'The text starts with Payment' },
  { token: '\\$[0-9]+', meaning: 'A literal dollar amount, such as $40' },
  { token: '\\bOTP\\b', meaning: 'OTP as a whole word, not inside another word' },
  { token: 'order .* shipped', meaning: 'order, then anything, then shipped' },
  { token: '.*', meaning: 'Everything, for a rule scoped to one app' },
];
