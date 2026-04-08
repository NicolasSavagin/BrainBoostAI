# 🚀 GUIA DE INÍCIO RÁPIDO - AI Learning Platform

## 📋 Checklist Inicial

### ✅ 1. Extrair e Preparar
- [ ] Extraia o arquivo `ai-learning-platform.zip`
- [ ] Abra o terminal na pasta extraída
- [ ] Execute `npm install` para instalar dependências

### ✅ 2. Configurar Firebase

#### Passo a Passo:

1. **Criar Projeto Firebase**
   - Acesse: https://console.firebase.google.com/
   - Clique em "Adicionar projeto"
   - Nome: `ai-learning-platform` (ou escolha outro)
   - Desabilite Google Analytics (opcional)
   - Clique em "Criar projeto"

2. **Configurar Authentication**
   - No menu lateral, clique em "Authentication"
   - Clique em "Começar"
   - Ative "E-mail/senha"
   - Ative "Google" (opcional, mas recomendado)

3. **Configurar Firestore**
   - No menu lateral, clique em "Firestore Database"
   - Clique em "Criar banco de dados"
   - Escolha "Iniciar no modo de teste"
   - Selecione a região mais próxima

4. **Obter Credenciais**
   - Clique no ícone de engrenagem (⚙️) > "Configurações do projeto"
   - Role até "Seus apps" > "SDK para a Web"
   - Clique em "</>" (Web)
   - Registre o app com um nome
   - Copie as credenciais do `firebaseConfig`

### ✅ 3. Configurar Anthropic (Claude AI)

1. **Criar Conta Anthropic**
   - Acesse: https://console.anthropic.com/
   - Crie uma conta (pode usar Google)
   - Você receberá créditos gratuitos para testar!

2. **Gerar API Key**
   - No Console, clique em "API Keys"
   - Clique em "Create Key"
   - Dê um nome: `ai-learning-platform`
   - Copie a chave (começa com `sk-ant-api03-`)
   - **IMPORTANTE**: Guarde em local seguro!

### ✅ 4. Configurar Variáveis de Ambiente

1. **Copiar arquivo de exemplo**
   ```bash
   cp .env.example .env
   ```

2. **Editar .env**
   Abra o arquivo `.env` e preencha:

   ```env
   # Firebase (cole os valores do firebaseConfig)
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto-id
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123

   # Anthropic (cole sua API key)
   VITE_ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXX
   ```

### ✅ 5. Executar o Projeto

```bash
# Instalar dependências (se ainda não fez)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Abra o navegador em: `http://localhost:3000`

## 🎯 Primeiros Passos no App

### 1. Criar Conta
- Clique em "Cadastre-se gratuitamente"
- Preencha nome, email e senha
- Ou use "Continuar com Google"

### 2. Explorar Dashboard
- Veja suas estatísticas
- Confira metas diárias
- Explore conquistas

### 3. Testar Exercícios com IA
- Vá em "Praticar"
- Escolha um tópico (ex: "Programação - JavaScript")
- Ajuste a dificuldade
- Clique em "Gerar Exercício com IA"
- **Aguarde 3-5 segundos** para a IA gerar
- Responda e receba feedback personalizado!

### 4. Ver Progresso
- Acesse "Progresso" para ver gráficos
- Acompanhe sua evolução semanal

## 🔧 Solução de Problemas Comuns

### Erro: "Firebase: Error (auth/invalid-api-key)"
**Solução**: Verifique se copiou corretamente a API Key do Firebase no `.env`

### Erro: "Anthropic API error"
**Solução**: 
- Verifique se sua API Key está correta
- Confirme que tem créditos disponíveis em https://console.anthropic.com/
- Aguarde alguns segundos (a primeira chamada pode ser lenta)

### Erro: "Module not found"
**Solução**: Execute `npm install` novamente

### Página em branco
**Solução**:
1. Abra o Console do navegador (F12)
2. Veja os erros
3. Verifique se o `.env` está configurado corretamente
4. Reinicie o servidor (`Ctrl+C` e `npm run dev` novamente)

## 🎨 Personalização Rápida

### Mudar Cor Principal
Edite `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#10b981', // Verde
    600: '#059669',
  }
}
```

### Adicionar Novo Tópico
Edite `src/pages/Learn.jsx` e adicione ao array `subjects`

### Mudar Logo
Substitua o ícone `Brain` por outro em `src/components/layouts/AuthLayout.jsx` e `src/components/navigation/Sidebar.jsx`

## 📱 Testar Responsividade

1. **Chrome DevTools**
   - Pressione F12
   - Clique no ícone de celular (Toggle device toolbar)
   - Teste diferentes tamanhos

## 🚀 Deploy (Opcional)

### Vercel (Grátis e Fácil)

```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel

# Siga as instruções
# Configure as variáveis de ambiente no dashboard
```

### Netlify

```bash
# Build
npm run build

# Arraste a pasta 'dist' para netlify.com/drop
```

## 📚 Próximos Passos

1. **Adicionar mais exercícios**
   - Edite `src/services/aiService.js`
   - Crie novos tipos de exercícios

2. **Melhorar prompts da IA**
   - Ajuste os prompts em `aiService.js` para resultados melhores

3. **Adicionar analytics**
   - Firebase Analytics
   - Google Analytics

4. **Criar mais conquistas**
   - Edite o array de achievements no Dashboard

5. **Implementar sistema de pontos**
   - Adicione lógica de XP no Firestore

## 🆘 Precisa de Ajuda?

### Documentações Úteis
- **React**: https://react.dev/
- **Firebase**: https://firebase.google.com/docs
- **Anthropic**: https://docs.anthropic.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/

### Comunidades
- Stack Overflow
- Reddit r/reactjs
- Discord do Firebase

## ✅ Checklist Final

Antes de apresentar o projeto:

- [ ] App funciona sem erros
- [ ] Autenticação funcionando (login/registro)
- [ ] Exercícios gerando com IA
- [ ] Gráficos aparecendo
- [ ] Tema dark/light funcionando
- [ ] Responsivo em mobile
- [ ] README atualizado
- [ ] .env.example presente
- [ ] Código comentado onde necessário

## 🎓 Para o TCC

### Estrutura Sugerida

1. **Introdução**
   - Problema: Falta de personalização no ensino
   - Solução: IA adaptativa

2. **Fundamentação Teórica**
   - Aprendizado adaptativo
   - Gamificação
   - IA generativa

3. **Desenvolvimento**
   - Arquitetura do sistema
   - Tecnologias escolhidas
   - Implementação

4. **Resultados**
   - Testes de usabilidade
   - Métricas de aprendizado
   - Feedback de usuários

5. **Conclusão**
   - Objetivos alcançados
   - Limitações
   - Trabalhos futuros

### Dicas
- Documente decisões técnicas
- Tire screenshots do app
- Faça testes com usuários reais
- Grave vídeos demonstrando funcionalidades

---

**Boa sorte com seu projeto! 🚀**
