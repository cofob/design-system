"use client";

import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export function useControllableState<T>(options: {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, Dispatch<SetStateAction<T>>] {
  const { value, defaultValue, onChange } = options;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(currentValue) : next;
      if (!controlled) setInternalValue(resolved);
      if (!Object.is(currentValue, resolved)) onChange?.(resolved);
    },
    [controlled, currentValue, onChange],
  );

  return [currentValue, setValue];
}
