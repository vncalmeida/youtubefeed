import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';
import ChannelSection from '../components/ChannelSection';
import { Channel, Video } from '../types';
import ThemeToggle from '../components/ThemeToggle';
import LogoutButton from '../components/LogoutButton';
import { getChannels } from '../service/channels';

type PerfFilter = 'all' | 'high' | 'medium' | 'low';

const calculatePerformance = (
  views: number,
  likes: number,
  publishedAt: string,
  subscriberCount: number
): 'high' | 'medium' | 'low' => {
  const now = new Date();
  const publishDate = new Date(publishedAt);
  const ageInHours = Math.max(1, (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60));
  const viewsPerHour = views / ageInHours;
  const engagementRate = views > 0 ? (likes / views) * 100 : 0;
  const subscriberPenetration = subscriberCount > 0 ? (views / subscriberCount) * 100 : 0;

  const factors = {
    viewsVelocity: Math.log10(viewsPerHour + 1) * 0.4,
    engagement: engagementRate * 0.3,
    subscriberReach: subscriberPenetration * 0.2,
    absolutePopularity: Math.log10(likes + 1) * 0.1,
  };

  const totalScore =
    factors.viewsVelocity + factors.engagement + factors.subscriberReach + factors.absolutePopularity;

  if (totalScore >= 7.5) return 'high';
  if (totalScore >= 4.5) return 'medium';
  return 'low';
};

const fetchVideos = async (channel: Channel): Promise<Video[]> => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.youtubeId}&maxResults=50&order=date&type=video&publishedAfter=${oneWeekAgo.toISOString()}&key=${API_KEY}`
    );
    const data = await response.json();
    if (!data.items) return [];

    const videoIds = data.items
      .filter((item: any) => item.id.videoId)
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) return [];

    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`
    );
    const statsData = await statsResponse.json();

    return statsData.items.map((item: any) => {
      const views = Number(item.statistics.viewCount || 0);
      const likes = Number(item.statistics.likeCount || 0);
      const comments = Number(item.statistics.commentCount || 0);

      const perf = calculatePerformance(views, likes, item.snippet.publishedAt, channel.subscriberCount);

      return {
        id: item.id,
        title: item.snippet.title,
        channelId: channel.id,
        channelName: channel.name,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        publishedAt: item.snippet.publishedAt,
        views,
        likes,
        comments,
        performance: perf,
        metrics: {
          ageInHours:
            (Date.now() - new Date(item.snippet.publishedAt).getTime()) / (1000 * 60 * 60),
          engagementRate: views > 0 ? (likes / views) * 100 : 0,
          subscriberPenetration:
            channel.subscriberCount > 0 ? (views / channel.subscriberCount) * 100 : 0,
        },
        sentimentScore: Math.min(100, Math.max(0, Math.round((likes / (views || 1)) * 100))),
        engagementRate: 0,
      } as unknown as Video;
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

// Skeleton para carregamento
const SkeletonCard = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:bg-[#0F0F11] dark:border-white/10">
    <div className="aspect-video w-full bg-gray-100 dark:bg-white/5" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-white/5" />
      <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-white/5" />
      <div className="grid grid-cols-4 gap-2">
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5" />
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5" />
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5" />
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5" />
      </div>
    </div>
  </div>
);

export function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videosByChannel, setVideosByChannel] = useState<Map<string, Video[]>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<PerfFilter>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);

  const { scrollY } = useScroll();
  const { ref } = useInView({ threshold: 0 });

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious();
    const diff = latest - (previous ?? latest);
    if (latest < 50) {
      setIsHeaderVisible(true);
      return;
    }
    setIsHeaderVisible(diff <= 0);
  });

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const channelData = await getChannels();
      setChannels(channelData);

      const videosMap = new Map<string, Video[]>();
      for (const channel of channelData) {
        const videos = await fetchVideos(channel);
        videosMap.set(channel.id, videos);
      }
      setVideosByChannel(videosMap);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const filteredChannels = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return channels
      .map((c) => {
        const vids = (videosByChannel.get(c.id) || []).filter((v) => {
          const matchesTerm =
            !term ||
            v.title.toLowerCase().includes(term) ||
            v.channelName.toLowerCase().includes(term);
          const matchesFilter = filter === 'all' || v.performance === filter;
          return matchesTerm && matchesFilter;
        });
        return { channel: c, videos: vids };
      })
      .filter((x) => x.videos.length > 0);
  }, [channels, videosByChannel, searchTerm, filter]);

  const FilterButton = useCallback(
    ({ value, label }: { value: PerfFilter; label: string }) => (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full md:w-auto rounded-full px-4 py-2 text-sm font-medium transition-all ${
          filter === value
            ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 dark:shadow-[var(--primary-dark)]/20 hover:bg-[var(--primary-dark)]'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
        }`}
        onClick={() => {
          setFilter(value);
          setIsFilterMenuOpen(false);
        }}
      >
        {label}
      </motion.button>
    ),
    [filter]
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-[#0B0B0C]">
      {/* Header flutuante */}
      <motion.header
        initial={false}
        animate={{ y: isHeaderVisible ? 0 : '-100%', opacity: isHeaderVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
        className="fixed inset-x-0 top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-md shadow-sm dark:border-white/10 dark:bg-[#0B0B0C]/70"
      >
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            {/* Busca */}
            <div className="w-full">
              <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''}`}>
                <div
                  className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isFocused ? 'text-[var(--primary)]' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar vídeos ou canais…"
                  className={`w-full rounded-full border-2 bg-gray-100 pl-10 pr-4 py-2.5 outline-none transition-all focus:ring-4 focus:ring-[var(--primary)]/20 dark:bg-white/5 dark:text-gray-100 ${
                    isFocused
                      ? 'border-[var(--primary)] bg-white dark:bg-white/10 shadow-lg'
                      : 'border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </div>
            </div>

            {/* Ações (um único bloco responsivo) */}
            <div className="mt-2 flex w-full items-center gap-2 md:mt-0 md:justify-end">

              <ThemeToggle className="flex-none" />
              <LogoutButton className="flex-none" />
            </div>

            {/* Filtros (toggle mobile) */}
            <div className="mt-2 w-full md:hidden">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFilterMenuOpen((v) => !v)}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                  isFilterMenuOpen
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 dark:shadow-[var(--primary-dark)]/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                }`}
              >
                {isFilterMenuOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                Filtros
              </motion.button>
            </div>

            {/* Filtros (desktop) */}
            <div className="hidden items-center gap-2 md:flex">
              <FilterButton value="all" label="Todos" />
              <FilterButton value="high" label="Alto" />
              <FilterButton value="medium" label="Médio" />
              <FilterButton value="low" label="Baixo" />
            </div>
          </div>

          {/* Menu colapsável (mobile) */}
          <AnimatePresence initial={false}>
            {isFilterMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden"
              >
                <div className="flex flex-col gap-2 py-2">
                  <FilterButton value="all" label="Todos" />
                  <FilterButton value="high" label="Alto" />
                  <FilterButton value="medium" label="Médio" />
                  <FilterButton value="low" label="Baixo" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-7xl px-4 pt-44 pb-12 md:pt-28">
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading &&
          filteredChannels.map(({ channel, videos }) => (
            <ChannelSection key={channel.id} channel={channel} videos={videos} />
          ))}

        {!loading && filteredChannels.length === 0 && (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] dark:text-[var(--primary)]">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nada encontrado</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Ajuste os filtros ou tente outros termos de pesquisa.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}

        <div ref={ref} className="h-20" />
      </main>
    </div>
  );
}

export default Dashboard;
