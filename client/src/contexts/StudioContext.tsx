/**
 * StudioContext: Kawaii Bubble Pop Design — Nano Banana Studio
 * Global state for API configs, generation params, and gallery
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  type ApiConfig,
  type GenerationParams,
  type GeneratedImage,
  DEFAULT_API_CONFIGS,
  DEFAULT_GENERATION_PARAMS,
  loadFromStorage,
  saveToStorage,
} from '@/lib/store';
import { generateImage, type GenerationResult } from '@/lib/api-service';
import { nanoid } from 'nanoid';

interface StudioState {
  // API configs
  apiConfigs: ApiConfig[];
  activeConfig: ApiConfig | null;
  addApiConfig: (config: Omit<ApiConfig, 'id'>) => void;
  updateApiConfig: (id: string, updates: Partial<ApiConfig>) => void;
  deleteApiConfig: (id: string) => void;
  setActiveConfig: (id: string) => void;

  // Generation params
  params: GenerationParams;
  updateParams: (updates: Partial<GenerationParams>) => void;
  resetParams: () => void;

  // Generation
  isGenerating: boolean;
  progress: number;
  generate: () => Promise<GenerationResult | null>;

  // Gallery
  gallery: GeneratedImage[];
  addToGallery: (images: GeneratedImage[]) => void;
  removeFromGallery: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearGallery: () => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const StudioContext = createContext<StudioState | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  // API configs
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>(() =>
    loadFromStorage('nb-api-configs', DEFAULT_API_CONFIGS)
  );

  const [activeConfigId, setActiveConfigId] = useState<string>(() =>
    loadFromStorage('nb-active-config', DEFAULT_API_CONFIGS[0]?.id || '')
  );

  const activeConfig = apiConfigs.find(c => c.id === activeConfigId) || apiConfigs[0] || null;

  // Generation params
  const [params, setParams] = useState<GenerationParams>(() =>
    loadFromStorage('nb-gen-params', DEFAULT_GENERATION_PARAMS)
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Gallery
  const [gallery, setGallery] = useState<GeneratedImage[]>(() =>
    loadFromStorage('nb-gallery', [])
  );

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => { saveToStorage('nb-api-configs', apiConfigs); }, [apiConfigs]);
  useEffect(() => { saveToStorage('nb-active-config', activeConfigId); }, [activeConfigId]);
  useEffect(() => { saveToStorage('nb-gen-params', params); }, [params]);
  useEffect(() => { saveToStorage('nb-gallery', gallery); }, [gallery]);

  const addApiConfig = useCallback((config: Omit<ApiConfig, 'id'>) => {
    const newConfig: ApiConfig = { ...config, id: nanoid() };
    setApiConfigs(prev => [...prev, newConfig]);
    if (!activeConfigId) setActiveConfigId(newConfig.id);
  }, [activeConfigId]);

  const updateApiConfig = useCallback((id: string, updates: Partial<ApiConfig>) => {
    setApiConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteApiConfig = useCallback((id: string) => {
    setApiConfigs(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeConfigId === id && next.length > 0) {
        setActiveConfigId(next[0].id);
      }
      return next;
    });
  }, [activeConfigId]);

  const setActiveConfigFn = useCallback((id: string) => {
    setActiveConfigId(id);
  }, []);

  const updateParams = useCallback((updates: Partial<GenerationParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  }, []);

  const resetParams = useCallback(() => {
    setParams(DEFAULT_GENERATION_PARAMS);
  }, []);

  const generate = useCallback(async (): Promise<GenerationResult | null> => {
    if (!activeConfig || !params.prompt.trim()) return null;

    setIsGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const result = await generateImage(params, activeConfig);
      setProgress(100);

      if (result.success && result.images.length > 0) {
        const newImages: GeneratedImage[] = result.images.map(url => ({
          id: nanoid(),
          url,
          prompt: params.prompt,
          params: { ...params },
          timestamp: Date.now(),
          apiConfigId: activeConfig.id,
          isFavorite: false,
        }));
        setGallery(prev => [...newImages, ...prev]);
      }

      return result;
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 500);
    }
  }, [activeConfig, params]);

  const addToGallery = useCallback((images: GeneratedImage[]) => {
    setGallery(prev => [...images, ...prev]);
  }, []);

  const removeFromGallery = useCallback((id: string) => {
    setGallery(prev => prev.filter(img => img.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setGallery(prev => prev.map(img =>
      img.id === id ? { ...img, isFavorite: !img.isFavorite } : img
    ));
  }, []);

  const clearGallery = useCallback(() => {
    setGallery([]);
  }, []);

  return (
    <StudioContext.Provider value={{
      apiConfigs, activeConfig, addApiConfig, updateApiConfig, deleteApiConfig, setActiveConfig: setActiveConfigFn,
      params, updateParams, resetParams,
      isGenerating, progress, generate,
      gallery, addToGallery, removeFromGallery, toggleFavorite, clearGallery,
      sidebarOpen, setSidebarOpen, rightPanelOpen, setRightPanelOpen, settingsOpen, setSettingsOpen,
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}
