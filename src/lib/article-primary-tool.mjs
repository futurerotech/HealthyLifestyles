/** Whether an article already contains its primary calculator as an authored block. */
export function needsPrimaryToolEmbed(primarySlug, body, canonicalize = value => value) {
  if (!primarySlug) return false;
  const target = canonicalize(primarySlug);
  return !body.some(block => {
    if (block.type === 'tool') return canonicalize(block.slug || '') === target;
    if (block.type !== 'cms' || !['toolEmbed', 'calculatorEmbed'].includes(block.block?.blockType)) return false;
    const tool = block.block.tool;
    const slug = typeof tool === 'string' ? tool : tool?.slug;
    return typeof slug === 'string' && canonicalize(slug) === target;
  });
}
