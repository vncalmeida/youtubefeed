import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoMetrics } from '../types';
import { X, TrendingUp, MessageCircle, ThumbsUp } from 'lucide-react';

interface VideoModalProps {
  video: Video;
  metrics: VideoMetrics;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, metrics, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>

          <div className="overflow-y-auto max-h-[90vh] p-6">
            <div className="aspect-video w-full mb-6 rounded-xl overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="px-2">
              <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
              <p className="text-gray-600 mb-6">{video.channelName}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-[var(--primary)]" size={20} />
                    <span className="font-semibold">Taxa de Engajamento</span>
                  </div>
                  <p className="text-2xl font-bold">{video.engagementRate.toFixed(1)}%</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="text-[var(--primary)]" size={20} />
                    <span className="font-semibold">Proporção de Likes</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {((video.likes / video.views) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="text-[var(--primary)]" size={20} />
                    <span className="font-semibold">Taxa de Comentários</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {((video.comments / video.views) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Análise de Sentimento</h3>
                <div className="relative h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div 
                    style={{ width: `${metrics.sentimentAnalysis.positive}%` }}
                    className="absolute left-0 h-full bg-green-500"
                  />
                  <div 
                    style={{ 
                      width: `${metrics.sentimentAnalysis.neutral}%`,
                      left: `${metrics.sentimentAnalysis.positive}%`
                    }}
                    className="absolute h-full bg-yellow-500"
                  />
                  <div 
                    style={{ 
                      width: `${metrics.sentimentAnalysis.negative}%`,
                      left: `${metrics.sentimentAnalysis.positive + metrics.sentimentAnalysis.neutral}%`
                    }}
                    className="absolute h-full bg-[var(--primary)]"
                  />
                </div>
                <div className="flex justify-between text-sm mt-2 text-gray-600">
                  <span>Positivo ({metrics.sentimentAnalysis.positive}%)</span>
                  <span>Neutro ({metrics.sentimentAnalysis.neutral}%)</span>
                  <span>Negativo ({metrics.sentimentAnalysis.negative}%)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
