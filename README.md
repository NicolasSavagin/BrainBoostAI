# 🎓 AI Learning Platform

Uma plataforma de ensino personalizada com Inteligência Artificial, similar ao Duolingo, desenvolvida com React e Firebase.

## ✨ Características Principais

### 🤖 IA Personalizada
- Exercícios gerados dinamicamente usando Gemini
- Feedback inteligente e personalizado
- Análise de progresso com insights da IA
- Plano de estudos adaptativo baseado no desempenho

### 🎮 Gamificação Completa
- Sistema de XP e Níveis
- Streak diário (sequência de dias estudando)
- Conquistas (Achievements)
- Ranking entre usuários
- Metas diárias personalizáveis

### 📚 Módulos de Aprendizado
- Dashboard com visão geral do progresso
- Área de aprendizado com múltiplos tópicos
- Prática com exercícios diversos
- Análise de progresso com gráficos
- Perfil de usuário completo
- Sistema de ranking

### 🎨 Interface Moderna
- Design responsivo (mobile e desktop)
- Tema Dark/Light
- Animações suaves
- Componentes reutilizáveis
- Feedback visual em tempo real

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool rápida
- **React Router** - Navegação
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **Recharts** - Gráficos
- **Lucide React** - Ícones
- **Zustand** - Gerenciamento de estado

### Backend
- **Firebase Authentication** - Autenticação de usuários
- **Firebase Firestore** - Banco de dados NoSQL
- **Firebase Storage** - Armazenamento de arquivos

### IA
- **Gemini API** - Geração de conteúdo e feedback inteligente

## 📁 Estrutura do Projeto

```
ai-learning-platform/
├── src/
│   ├── components/
│   │   ├── auth/             # Componentes de autenticação
│   │   ├── common/           # Componentes comuns
│   │   ├── layouts/          # Layouts da aplicação
│   │   └── navigation/       # Componentes de navegação
│   ├── config/
│   │   └── firebase.js       # Configuração do Firebase
│   ├── pages/
│   │   ├── auth/             # Páginas de autenticação
│   │   ├── Dashboard.jsx     # Dashboard principal
│   │   ├── Learn.jsx         # Página de aprendizado
│   │   ├── Practice.jsx      # Exercícios práticos
│   │   ├── Progress.jsx      # Análise de progresso
│   │   ├── Profile.jsx       # Perfil do usuário
│   │   └── Leaderboard.jsx   # Ranking
│   ├── services/
│   │   ├── authService.js    # Serviço de autenticação
│   │   └── aiService.js      # Serviço de IA
│   ├── store/
│   │   └── index.js          # Estado global (Zustand)
│   ├── App.jsx               # Componente raiz
│   ├── main.jsx              # Entry point
│   └── index.css             # Estilos globais
├── public/                   # Arquivos estáticos
├── .env.example              # Exemplo de variáveis de ambiente
├── package.json              # Dependências
├── vite.config.js            # Configuração do Vite
├── tailwind.config.js        # Configuração do Tailwind
└── README.md                 # Este arquivo
```

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos

- Node.js 16+ instalado
- Conta no Firebase
- API Key Gemini

### 2. Configurar Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication** (Email/Password e Google)
4. Ative **Firestore Database**
5. Ative **Storage** (opcional)
6. Copie as credenciais do projeto

### 3. Configurar Anthropic

1. Acesse [Anthropic Console](https://console.anthropic.com/)
2. Crie uma API Key
3. Copie a chave

### 4. Instalação

```bash
# Clone o repositório (ou extraia o ZIP)
cd ai-learning-platform

# Instale as dependências
npm install

# Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# Edite o .env com suas credenciais
nano .env  # ou use seu editor preferido
```

### 5. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# Anthropic API Configuration
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### 6. Executar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

O projeto estará rodando em `http://localhost:3000`

## 🔐 Estrutura de Dados (Firestore)

### Coleção: `users`

```javascript
{
  displayName: string,
  email: string,
  level: number,
  xp: number,
  totalXP: number,
  streak: number,
  lastLoginDate: string,
  achievements: array,
  completedExercises: number,
  accuracy: number,
  studyTime: number,
  preferences: {
    theme: 'light' | 'dark',
    notifications: boolean,
    soundEffects: boolean
  },
  stats: {
    totalExercises: number,
    correctAnswers: number,
    wrongAnswers: number,
    averageTime: number,
    topicsStudied: array
  },
  createdAt: timestamp
}
```

## 🎯 Funcionalidades da IA

### 1. Geração de Exercícios
```javascript
aiService.generateExercise(topic, difficulty, type, userLevel)
```
- Gera exercícios personalizados baseados no tópico
- Ajusta dificuldade dinamicamente
- Tipos: múltipla escolha, preencher lacunas, conversação, verdadeiro/falso

### 2. Feedback Inteligente
```javascript
aiService.provideFeedback(userAnswer, correctAnswer, question)
```
- Fornece feedback contextualizado
- Sugere melhorias
- Relaciona conceitos

### 3. Plano de Estudos
```javascript
aiService.generateLearningPath(userProfile, goals, weaknesses)
```
- Cria plano semanal personalizado
- Identifica áreas de melhoria
- Define marcos e objetivos

### 4. Análise de Progresso
```javascript
aiService.analyzeProgress(userStats, recentExercises)
```
- Analisa desempenho
- Identifica pontos fortes e fracos
- Fornece insights e próximos passos

## 🎨 Personalização

### Cores
Edite `tailwind.config.js` para mudar as cores principais:

```javascript
colors: {
  primary: {
    500: '#0ea5e9', // Cor principal
    600: '#0284c7',
  }
}
```

### Temas
O sistema de temas já está implementado. Alterne entre claro/escuro no header.

## 📱 Responsividade

O projeto é totalmente responsivo:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Segurança

### Autenticação
- Senhas criptografadas pelo Firebase
- Tokens JWT para sessões
- Proteção de rotas

### API Keys
- **NUNCA** commite o arquivo `.env`
- Use variáveis de ambiente
- Em produção, use backend para chamadas à API da Anthropic

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instale a CLI do Vercel
npm i -g vercel

# Deploy
vercel

# Configure as variáveis de ambiente no dashboard
```

### Netlify

```bash
# Instale a CLI do Netlify
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## 📈 Melhorias Futuras

- [ ] Sistema de chat com tutor IA
- [ ] Modo offline
- [ ] Notificações push
- [ ] Exportação de dados
- [ ] API REST própria
- [ ] Testes automatizados
- [ ] Mais tipos de exercícios
- [ ] Sistema de badges avançado
- [ ] Integração com calendário
- [ ] Relatórios em PDF

## 🤝 Contribuindo

Este é um projeto acadêmico, mas sugestões são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto foi desenvolvido para fins acadêmicos.

## 👨‍💻 Autor

Desenvolvido como Projeto Integrador - Ciências da Computação

## 🙏 Agradecimentos

- Anthropic pela API do Claude
- Firebase pela infraestrutura
- Comunidade React
- Tailwind CSS
- Lucide Icons

---

**Nota**: Este é um projeto educacional. Em produção, recomenda-se:
- Implementar backend próprio para segurança das API keys
- Adicionar testes automatizados
- Configurar CI/CD
- Implementar monitoramento e analytics
- Adicionar rate limiting
- Configurar backup do banco de dados
