/**
 * StudioContext — Nano Banana Studio
 * Global state for API configs, generation params, and gallery
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  type ApiConfig,
  type GenerationParams,
  type GeneratedImage,
  type ModelInfo,
  DEFAULT_API_CONFIGS,
  DEFAULT_GENERATION_PARAMS,
  loadFromStorage,
  saveToStorage,
  loadGenerationParamsFromStorage,
  saveGenerationParamsToStorage,
} from '@/lib/store';
import { generateImage, fetchModels as apiFetchModels, type GenerationResult } from '@/lib/api-service';
import { nanoid } from 'nanoid';

interface StudioState {
  // API configs
  apiConfigs: ApiConfig[];
  activeConfig: ApiConfig | null;
  addApiConfig: (config: Omit<ApiConfig, 'id'>) => void;
  updateApiConfig: (id: string, updates: Partial<ApiConfig>) => void;
  deleteApiConfig: (id: string) => void;
  setActiveConfig: (id: string) => void;

  // Models
  availableModels: Record<string, ModelInfo[]>; // configId → models
  fetchingModels: Record<string, boolean>;      // configId → loading
  refreshModels: (configId: string) => Promise<void>;

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
    loadGenerationParamsFromStorage('nb-gen-params').data
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Gallery
  const [gallery, setGallery] = useState<GeneratedImage[]>(() =>
    loadFromStorage('nb-gallery', [])
  );

  // Models
  const [availableModels, setAvailableModels] = useState<Record<string, ModelInfo[]>>({});
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const fetchedKeysRef = useRef<Set<string>>(new Set());

  // UI state
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
  const [sidebarOpen, setSidebarOpen] = useState(!isMobileViewport);
  const [rightPanelOpen, setRightPanelOpen] = useState(!isMobileViewport);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => { saveToStorage('nb-api-configs', apiConfigs); }, [apiConfigs]);
  useEffect(() => { saveToStorage('nb-active-config', activeConfigId); }, [activeConfigId]);
  useEffect(() => { saveGenerationParamsToStorage('nb-gen-params', params); }, [params]);
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

  const refreshModels = useCallback(async (configId: string) => {
    const config = apiConfigs.find(c => c.id === configId);
    if (!config || !config.baseUrl || !config.apiKey) return;

    setFetchingModels(prev => ({ ...prev, [configId]: true }));
    try {
      const result = await apiFetchModels(config);
      if (result.success) {
        setAvailableModels(prev => ({ ...prev, [configId]: result.models }));
      }
    } finally {
      setFetchingModels(prev => ({ ...prev, [configId]: false }));
    }
  }, [apiConfigs]);

  // 当配置的 baseUrl/apiKey/format 变化时自动获取模型列表
  useEffect(() => {
    for (const config of apiConfigs) {
      if (!config.baseUrl || !config.apiKey) continue;
      const fetchKey = `${config.id}:${config.format}:${config.baseUrl}:${config.apiKey}`;
      if (fetchedKeysRef.current.has(fetchKey)) continue;
      fetchedKeysRef.current.add(fetchKey);
      refreshModels(config.id);
    }
  }, [apiConfigs, refreshModels]);

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
      availableModels, fetchingModels, refreshModels,
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
