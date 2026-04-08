import { Outlet } from 'react-router-dom';
import { Brain, Sparkles } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
              <Brain size={48} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-center">
            BrainBoostAI
          </h1>
          
          <p className="text-xl text-white text-opacity-90 mb-12 text-center max-w-md">
            Aprenda de forma personalizada com o poder da Inteligência Artificial
          </p>
          
          <div className="space-y-6 max-w-md">
            <div className="flex items-start gap-4">
              <Sparkles className="text-yellow-300 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-lg mb-1">Conteúdo Adaptativo</h3>
                <p className="text-white text-opacity-80">
                  Exercícios que se ajustam ao seu nível e ritmo de aprendizado
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <Sparkles className="text-yellow-300 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-lg mb-1">IA Personalizada</h3>
                <p className="text-white text-opacity-80">
                  Tutor virtual que entende suas dificuldades e pontos fortes
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <Sparkles className="text-yellow-300 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-lg mb-1">Gamificação</h3>
                <p className="text-white text-opacity-80">
                  Ganhe XP, conquiste achievements e mantenha seu streak!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-primary-600 rounded-xl">
              <Brain size={32} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Learning
            </span>
          </div>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
}
