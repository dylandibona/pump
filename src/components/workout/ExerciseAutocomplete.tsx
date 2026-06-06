'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getExerciseSuggestions, normalizeExerciseName } from '@/lib/exercises';
import { ExerciseInfo } from '@/lib/types';

interface ExerciseAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (exercise: ExerciseInfo | string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function ExerciseAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search exercises...',
  className,
  autoFocus,
}: ExerciseAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<ExerciseInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const results = getExerciseSuggestions(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = useCallback((exercise: ExerciseInfo) => {
    onChange(exercise.name);
    onSelect(exercise);
    setIsOpen(false);
    setSuggestions([]);
  }, [onChange, onSelect]);

  const handleCustomSubmit = useCallback(() => {
    const cleaned = normalizeExerciseName(value);
    if (cleaned) {
      onSelect(cleaned);
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [value, onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault();
        handleCustomSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (value.trim()) {
          handleCustomSubmit();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && suggestions.length > 0 && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="touch-target text-lg font-medium bg-background/50 border-primary/20 focus:border-primary/50 transition-colors"
        />
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            ✕
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-full bottom-full mb-2 glass shadow-2xl max-h-64 overflow-auto border border-primary/20"
          >
            {suggestions.map((exercise, index) => (
              <motion.li
                key={exercise.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`px-4 py-4 cursor-pointer transition-all ${
                  index === highlightedIndex
                    ? 'bg-primary/20 border-l-2 border-primary'
                    : 'hover:bg-primary/10 border-l-2 border-transparent'
                }`}
                onClick={() => handleSelect(exercise)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-display text-lg tracking-wider text-foreground">
                  {exercise.name.toUpperCase()}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {exercise.muscleGroups.slice(0, 3).map(group => (
                    <Badge
                      key={group}
                      variant="secondary"
                      className="text-xs bg-secondary/50 text-muted-foreground"
                    >
                      {group}
                    </Badge>
                  ))}
                </div>
              </motion.li>
            ))}

            {/* Custom exercise option */}
            {value.trim() && !suggestions.some(s => s.name.toLowerCase() === value.toLowerCase()) && (
              <motion.li
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`px-4 py-4 cursor-pointer border-t border-white/5 transition-all ${
                  highlightedIndex === -1
                    ? 'bg-accent/10 border-l-2 border-accent'
                    : 'hover:bg-accent/10 border-l-2 border-transparent'
                }`}
                onClick={handleCustomSubmit}
              >
                <div className="flex items-center gap-2">
                  <span className="text-accent">+</span>
                  <span className="text-muted-foreground">Add custom:</span>
                  <span className="font-display text-lg tracking-wider text-accent">
                    {value.toUpperCase()}
                  </span>
                </div>
              </motion.li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
