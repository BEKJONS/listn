import React from 'react';
import { XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
type MusicTrackEmbedProps = {
  embedUrl: string;
  onRemove?: () => void;
  showRemove?: boolean;
};
export function MusicTrackEmbed({
  embedUrl,
  onRemove,
  showRemove = false
}: MusicTrackEmbedProps) {
  // Convert Yandex Music URL to embed URL if needed
  const getEmbedUrl = (url: string): string => {
    if (url.includes('iframe')) {
      // Extract src from iframe code
      const match = url.match(/src="([^"]+)"/);
      return match ? match[1] : url;
    }
    if (url.includes('music.yandex')) {
      // Convert regular URL to embed URL
      return url.replace('music.yandex.ru', 'music.yandex.ru/iframe');
    }
    return url;
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      exit={{
        opacity: 0,
        scale: 0.95
      }}
      className="relative group">

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <iframe
          src={getEmbedUrl(embedUrl)}
          width="100%"
          height="180"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          className="block"
          title="Yandex Music Track" />

      </div>
      {showRemove && onRemove &&
      <button
        onClick={onRemove}
        className="
            absolute -top-2 -right-2 w-6 h-6 rounded-full
            bg-red-500/80 hover:bg-red-500
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          "






        aria-label="Remove track">

          <XIcon className="w-3 h-3 text-white" />
        </button>
      }
    </motion.div>);

}