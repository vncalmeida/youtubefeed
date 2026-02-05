import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Video } from '../types';
import { Eye, ThumbsUp, MessageCircle, TrendingUp } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

const numberFmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

const perfPill: Record<'high' | 'medium' | 'low', { label: string; classes: string }> = {
  high: {
    label: 'Alto',
    classes:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30',
  },
  medium: {
    label: 'Médio',
    classes:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30',
  },
  low: {
    label: 'Baixo',
    classes:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/30',
  },
};

const perfBar: Record<'high' | 'medium' | 'low', string> = {
  high: 'from-emerald-400 via-emerald-500 to-emerald-600',
  medium: 'from-amber-400 via-amber-500 to-amber-600',
  low: 'from-rose-400 via-rose-500 to-rose-600',
};

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const engagement =
    (video as any).metrics?.engagementRate ??
    (typeof (video as any).engagementRate === 'number' ? (video as any).engagementRate : 0);

  const publishedAgo = formatDistanceToNow(new Date(video.publishedAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const sentiment = Math.max(0, Math.min(100, Number((video as any).sentimentScore || 0)));

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm hover:shadow-md transition-shadow
                 dark:bg-[#0F0F11] dark:border-white/10"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Abrir vídeo ${video.title}`}
    >
      {/* Thumbnail */}
      <div className="relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full aspect-video object-cover"
          loading="lazy"
        />

        {/* Overlay gradiente suave */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0
                        opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Pílula de performance */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur
                        ${perfPill[video.performance].classes}`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {perfPill[video.performance].label}
          </span>
        </div>

        {/* Barra de performance (usa sentimentScore para comprimento) */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10 dark:bg-white/10">
          <div
            className={`h-full bg-gradient-to-r ${perfBar[video.performance]}`}
            style={{ width: `${sentiment}%` }}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors group-hover:text-gray-700
                       dark:text-white dark:group-hover:text-gray-200">
          {video.title}
        </h3>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {video.channelName} • {publishedAgo}
        </p>

        <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="font-medium">{numberFmt(video.views)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="h-4 w-4" />
            <span className="font-medium">{numberFmt(video.likes)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{numberFmt(video.comments)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{engagement.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Halo no hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute -inset-24 bg-[radial-gradient(40rem_40rem_at_var(--x,_50%)_0%,rgba(239,68,68,0.10),transparent_60%)]" />
      </div>
    </motion.article>
  );
};

export default VideoCard;
