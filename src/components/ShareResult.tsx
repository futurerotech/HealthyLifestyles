/** @jsxImportSource preact */
import { useCallback, useState } from 'preact/hooks';

interface Props {
  /** Tool name (e.g. "BMI Calculator") */
  tool: string;
  /** Primary result value (e.g. "22.9") */
  value: string;
  /** Primary label (e.g. "Your BMI") */
  label: string;
  /** Category label (e.g. "Normal weight") */
  category?: string;
  /** Category color hex */
  categoryColor?: string;
  /** Tool slug for result-image API */
  toolSlug?: string;
}

export default function ShareResult({ tool, value, label, category, categoryColor, toolSlug }: Props) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = category
    ? `My ${tool} result: ${value} — ${category}. Check yours:`
    : `My ${tool} result: ${value}. Check yours:`;

  const tweetText = `${shareText} ${shareUrl}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  }, [shareUrl]);

  const handleDownload = useCallback(() => {
    if (downloading) return;
    setDownloading(true);

    // First try the API endpoint for a high-quality server-generated image
    const params = new URLSearchParams({
      tool,
      value,
      label,
    });
    if (category) params.set('category', category);
    if (categoryColor) params.set('color', categoryColor);

    const apiUrl = `/api/result-image?${params.toString()}`;

    // Fetch the image and trigger download
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error('API failed');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${toolSlug || 'result'}-result-HealthyLifeStyles.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setDownloading(false);
      })
      .catch(() => {
        // Fallback: dispatch event for the existing canvas-based download
        document.dispatchEvent(
          new CustomEvent('hls:download-result-image', { detail: { format: 'wide' } })
        );
        setDownloading(false);
      });
  }, [tool, value, label, category, categoryColor, toolSlug, downloading]);

  return (
    <div class="share-result">
      <p class="share-result__heading">Share your result</p>
      <div class="share-result__buttons">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="share-result__btn share-result__btn--x"
          aria-label="Share result on X (Twitter)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
          </svg>
          <span>X</span>
        </a>

        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="share-result__btn share-result__btn--fb"
          aria-label="Share result on Facebook"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12S0 5.417 0 12.044c0 5.633 3.926 10.348 9.101 11.647Z" />
          </svg>
          <span>Facebook</span>
        </a>

        <button
          type="button"
          class="share-result__btn share-result__btn--copy"
          onClick={handleCopy}
          aria-label={copied ? 'Link copied' : 'Copy link'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            {copied ? (
              <>
                <polyline points="20 6 9 17 4 12" />
              </>
            ) : (
              <>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </>
            )}
          </svg>
          <span>{copied ? 'Copied!' : 'Copy link'}</span>
        </button>

        <button
          type="button"
          class="share-result__btn share-result__btn--download"
          onClick={handleDownload}
          disabled={downloading}
          aria-label="Download result image"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{downloading ? 'Generating...' : 'Download image'}</span>
        </button>
      </div>
    </div>
  );
}
