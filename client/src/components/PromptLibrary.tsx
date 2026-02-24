/**
 * PromptLibrary — Nano Banana Studio
 * Prompt template library with categories
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  category: string;
  style?: string;
}

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'character', label: '角色' },
  { id: 'landscape', label: '风景' },
  { id: 'animal', label: '动物' },
  { id: 'abstract', label: '抽象' },
  { id: 'food', label: '美食' },
  { id: 'scifi', label: '科幻' },
];

const TEMPLATES: PromptTemplate[] = [
  { id: '1', title: '梦幻猫咪', prompt: '一只可爱的猫咪坐在月亮上，周围是星星和云朵，梦幻水彩风格，柔和的色彩，发光效果', negativePrompt: '低质量，模糊', category: 'animal', style: 'watercolor' },
  { id: '2', title: '赛博城市', prompt: '赛博朋克城市夜景，霓虹灯倒映在雨水中，高楼大厦，飞行汽车，电影级画面，超高清', negativePrompt: '白天，乡村', category: 'scifi', style: 'cyberpunk' },
  { id: '3', title: '微型花园', prompt: '一个精致的玻璃瓶中有一个微型花园，阳光透过瓶子，超写实风格，微距摄影', category: 'abstract', style: 'photorealistic' },
  { id: '4', title: '和风庭院', prompt: '日式和风庭院，樱花飘落，锦鲤池塘，石灯笼，宁静氛围，水彩插画风格', category: 'landscape', style: 'watercolor' },
  { id: '5', title: '水晶城堡', prompt: '太空中漂浮的水晶城堡，星云背景，奇幻插画风格，发光的魔法阵', category: 'scifi', style: 'fantasy' },
  { id: '6', title: '拿铁艺术', prompt: '一杯冒着热气的拿铁咖啡，拉花是一只小熊，温暖的咖啡馆氛围，柔和的光线', category: 'food', style: 'photorealistic' },
  { id: '7', title: '精灵少女', prompt: '森林中的精灵少女，长发飘逸，蝴蝶围绕，魔法光效，动漫风格，精致细节', category: 'character', style: 'anime' },
  { id: '8', title: '极光冰原', prompt: '北极极光下的冰原，色彩斑斓的天空，冰山倒影，壮观自然景观，8K超高清', category: 'landscape', style: 'photorealistic' },
  { id: '9', title: '蒸汽机器人', prompt: '蒸汽朋克风格的可爱机器人，黄铜齿轮，蒸汽管道，复古工坊背景', category: 'scifi', style: 'digital-art' },
  { id: '10', title: '甜品天堂', prompt: '巨大的奶油蛋糕城堡，糖果装饰，彩虹色的天空，可爱的甜品角色', category: 'food', style: 'anime' },
  { id: '11', title: '星空鲸鱼', prompt: '在星空中游泳的巨大蓝鲸，身上有发光的星座图案，梦幻超现实主义', category: 'animal', style: 'surreal' },
  { id: '12', title: '像素冒险', prompt: '像素风格的RPG冒险场景，勇者站在龙面前，宝箱和金币，复古游戏画面', category: 'character', style: 'pixel-art' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PromptLibrary({ open, onClose }: Props) {
  const { updateParams } = useStudio();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = TEMPLATES.filter(t => {
    const matchCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !searchQuery || t.title.includes(searchQuery) || t.prompt.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const handleSelect = (template: PromptTemplate) => {
    updateParams({
      prompt: template.prompt,
      ...(template.negativePrompt && { negativePrompt: template.negativePrompt }),
      ...(template.style && { style: template.style }),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-3xl max-h-[80vh] bg-card border border-border rounded-lg overflow-hidden flex flex-col"
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="p-5 pb-3 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    提示词灵感库
                  </h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-md hover:bg-muted transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索提示词..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-muted/30 border border-border focus:border-foreground/30 focus:outline-none"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      activeCategory === cat.id
                        ? "bg-muted border border-border text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 border border-transparent"
                    )}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates grid */}
            <ScrollArea className="flex-1 p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filtered.map((template, i) => (
                  <motion.button
                    key={template.id}
                    className="text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelect(template)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.15 }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs font-semibold">{template.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">
                      {template.prompt}
                    </p>
                    {template.style && (
                      <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {template.style}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
