import React, { useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import LogoutButton from '../components/LogoutButton';
import { Channel } from '../types';
import { getChannels, addChannel, deleteChannel } from '../service/channels';

export function Settings() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious();
    const diff = latest - (previous ?? latest);
    if (latest < 50) {
      setIsHeaderVisible(true);
      return;
    }
    setIsHeaderVisible(diff <= 0);
  });

  const loadChannels = useCallback(async () => {
    try {
      const data = await getChannels();
      setChannels(data);
    } catch {
      setError('Erro ao carregar canais');
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const getChannelId = async (url: string): Promise<string> => {
    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
      /^@?([a-zA-Z0-9_-]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const candidate = match[1];

        if (/^UC[\w-]{22}$/.test(candidate)) {
          return candidate;
        }

        const handleResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${candidate}&key=${API_KEY}`
        );
        const handleData = await handleResponse.json();
        if (handleData.items?.length > 0) {
          return handleData.items[0].id;
        }
      }
    }

    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        url
      )}&key=${API_KEY}`
    );
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      throw new Error('Canal não encontrado na pesquisa geral');
    }

    return searchData.items[0].id.channelId;
  };

  const handleAddChannel = async () => {
    if (!newChannelUrl.trim()) {
      setError('Por favor, insira a URL do canal');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      const channelId = await getChannelId(newChannelUrl.trim());

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Erro na API do YouTube');
      }
      if (!data.items || data.items.length === 0) {
        throw new Error('Nenhum dado encontrado para este canal');
      }

      const channel = data.items[0];
      const thumbnails = channel.snippet.thumbnails;

      const channelData = {
        name: channel.snippet.title,
        avatar: thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default.url,
        subscriberCount: Number(channel.statistics.subscriberCount),
        url: `https://youtube.com/channel/${channelId}`,
        youtubeId: channelId,
        addedAt: new Date().toISOString()
      };

      await addChannel(channelData);

      await loadChannels();
      setNewChannelUrl('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível identificar o canal. Verifique a URL e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChannel = async (channelId: string) => {
    try {
      await deleteChannel(channelId);
      await loadChannels();
    } catch {
      setError('Erro ao remover canal');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-[#0B0B0C]">
      {/* Header flutuante alinhado ao Dashboard */}
      <motion.header
        initial={false}
        animate={{ y: isHeaderVisible ? 0 : '-100%', opacity: isHeaderVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
        className="fixed inset-x-0 top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-md shadow-sm dark:border-white/10 dark:bg-[#0B0B0C]/70"
      >
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center rounded-full px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                title="Voltar ao Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="ml-2 hidden text-sm md:inline">Dashboard</span>
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 md:text-xl">
                Configurações
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle className="flex-none" />
              <LogoutButton className="flex-none" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-7xl px-4 pt-44 pb-12 md:pt-28">
        <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11] sm:p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
            Configurações dos Canais
          </h2>

          {/* Adicionar novo canal */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
              Adicionar Novo Canal
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className={`relative flex-1 transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''}`}>
                <input
                  type="text"
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ex: https://youtube.com/@MeuCanal ou @MeuCanal"
                  className={`w-full rounded-full border-2 bg-gray-100 px-4 py-2.5 outline-none transition-all focus:ring-4 focus:ring-[var(--primary)]/20 dark:bg-white/5 dark:text-gray-100 ${
                    isFocused
                      ? 'border-[var(--primary)] bg-white dark:bg-white/10 shadow-lg'
                      : 'border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                />
              </div>
              <button
                onClick={handleAddChannel}
                disabled={loading}
                className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-white transition-all sm:w-auto ${
                  loading
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className=" -ml-1 mr-3 h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processando...
                  </span>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar Canal
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-3 rounded-lg bg-[var(--primary)]/10 px-4 py-2 text-sm text-[var(--primary)]">
                {error}
              </p>
            )}
          </div>

          {/* Lista de canais */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Canais Gerenciados</h3>
            <div className="space-y-3">
              {channels.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-8 text-center dark:bg-white/5">
                  <p className="italic text-gray-500 dark:text-gray-400">Nenhum canal adicionado ainda</p>
                </div>
              ) : (
                channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200/70 bg-gray-50 p-4 transition-all duration-200 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 sm:flex-row sm:items-center sm:gap-0"
                  >
                    <div className="flex items-center">
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                      />
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{channel.name}</h4>
                        <div className="space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                          <p>{new Intl.NumberFormat('pt-BR').format(channel.subscriberCount)} inscritos</p>
                          <p className="text-xs">
                            Adicionado em{' '}
                            {channel.addedAt ? new Date(channel.addedAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveChannel(channel.id)}
                      className="ml-auto rounded-full p-2 text-gray-400 transition-colors hover:text-[var(--primary)] focus:outline-none dark:text-gray-500"
                      title="Remover canal"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Settings;
