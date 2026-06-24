/** Homepage FAQ — rendered as an accordion and as FAQPage JSON-LD. */
export interface FaqItem {
  q: string;
  a: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    q: 'Are the health calculators free to use?',
    a: 'Yes. Every calculator and tool on HealthyLifeStyles is completely free, with no signup, subscription, or paywall. You can use them as often as you like.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No account is required. The tools run instantly in your browser — just enter your numbers and get your result.',
  },
  {
    q: 'Is my data stored or shared?',
    a: 'No. The values you enter are processed in your browser to show your result and are never sent to a server, stored, or shared with anyone.',
  },
  {
    q: 'How accurate are the results?',
    a: 'Each tool uses established, peer-reviewed scientific formulas (such as Mifflin-St Jeor for metabolism and the U.S. Navy method for body fat) and we cite the source on every tool page.',
  },
  {
    q: 'Can I use these tools for medical decisions?',
    a: 'Our tools are for general education and wellness only and are not a substitute for professional medical advice. Always consult a qualified healthcare provider before making health decisions.',
  },
  {
    q: 'Which units do the calculators support?',
    a: 'All tools support both metric (kg, cm) and imperial (lb, ft/in) units, so they work for users in the US, UK, Canada, Australia, and beyond.',
  },
];
