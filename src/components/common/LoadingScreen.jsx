import { Brain } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-white bg-opacity-20 rounded-3xl backdrop-blur-sm animate-pulse">
            <Brain size={64} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Conexy
        </h2>

        <p className="text-white/80 mb-4">
          Aprenda com IA de forma inteligente
        </p>

        <div className="flex gap-2 justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}