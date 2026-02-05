import React from 'react';
import { Channel, Video } from '../types';
import { TrendingUp, Users, Gauge } from 'lucide-react';
import VideoCard from './VideoCard';

interface ChannelSectionProps {
  channel: Channel;
  videos: Video[];
}

const numberFmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

const PerfPill = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const map = {
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
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur ${map[level].classes}`}
    >
      <Gauge className="h-3.5 w-3.5" />
      {map[level].label}
    </span>
  );
};

export function ChannelSection({ channel, videos }: ChannelSectionProps) {
  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm
                        dark:bg-[#0F0F11] dark:border-white/10">
      {/* Header do canal */}
      <div className="border-b border-gray-200/70 p-6 dark:border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={channel.avatar}
              alt={channel.name}
              className="h-16 w-16 rounded-full border-2 border-[var(--primary)]/20 dark:border-[var(--primary)]/30 object-cover"
              loading="lazy"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{channel.name}</h2>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                {numberFmt(channel.subscriberCount)} inscritos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {videos.length} vídeos esta semana
            </span>
          </div>
        </div>
      </div>

      {/* Grid de vídeos — reaproveita o VideoCard para padronizar */}
      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => {
              const id = (video as any).id;
              if (id) {
                window.open(`https://www.youtube.com/watch?v=${id}`, '_blank', 'noopener,noreferrer');
              }
            }}
          />
        ))}
      </div>

      {/* Rodapé com distribuição de performance */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-200/70 px-6 py-4 dark:border-white/10">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Desempenho recente:</span>
        <div className="flex items-center gap-2">
          <PerfPill level="high" />
          <PerfPill level="medium" />
          <PerfPill level="low" />
        </div>
      </div>
    </section>
  );
}

export default ChannelSection;
