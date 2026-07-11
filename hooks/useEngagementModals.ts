import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '@/store';

export function useNightlyReflection() {
  const reflections = useStore((s) => s.reflections);
  const addReflection = useStore((s) => s.addReflection);
  const getReflectionForDate = useStore((s) => s.getReflectionForDate);
  const [showModal, setShowModal] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 21 && !getReflectionForDate(today)) {
      setShowModal(true);
    }
  }, [getReflectionForDate, today]);

  const save = (distraction: Parameters<typeof addReflection>[0]['distraction'], note?: string) => {
    addReflection({ distraction, note });
    setShowModal(false);
  };

  const skip = () => setShowModal(false);

  return { showModal, save, skip, reflections, setShowModal };
}

export function usePlanTomorrow() {
  const [showPlan, setShowPlan] = useState(false);
  return { showPlan, setShowPlan };
}
