import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  userProfile: JSON.parse(localStorage.getItem('userProfile')) || null,
  loading: true,

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setUserProfile: (profile) => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    set({ userProfile: profile });
  },

  setLoading: (loading) => set({ loading }), // 🔥 ESSENCIAL

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    set({ user: null, userProfile: null });
  },
}));

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
}));

export const useLearningStore = create((set, get) => ({
  currentLesson: null,
  currentExercise: null,
  exerciseHistory: [],
  dailyGoal: 5,
  completedToday: 0,
  streak: 0,
  
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  setCurrentExercise: (exercise) => set({ currentExercise: exercise }),
  
addExerciseResult: (result) => set((state) => {
  const newHistory = [...state.exerciseHistory, result];

  const correctAnswers = newHistory.filter(r => r.correct).length;
  const total = newHistory.length;

  const accuracy = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;

  const xpGain = result.correct ? 10 : 2;

  return {
    exerciseHistory: newHistory,
    completedToday: state.completedToday + 1,
    streak: state.streak + 1, // simples (depois dá pra melhorar)
  };
}),
  
  resetDailyProgress: () => set({ completedToday: 0 }),
  
  updateStreak: (newStreak) => set({ streak: newStreak }),
  
  getDailyProgress: () => {
    const state = get();
    return (state.completedToday / state.dailyGoal) * 100;
  },
}));

export const useNotificationStore = create((set) => ({
  notifications: [],
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...notification,
      },
    ],
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
}));

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  modalOpen: false,
  modalContent: null,
  loading: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),
  
  setLoading: (loading) => set({ loading }),
}));
