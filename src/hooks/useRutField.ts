import { useCallback, useState, type ChangeEvent } from "react";
import {
  cleanRut,
  formatRutWhileTyping,
  normalizeRut,
  validateRut,
  RUT_MESSAGES,
} from "@/lib/utils/rut";

export type UseRutFieldOptions = {
  /** Valor inicial (desde BD o vacío) */
  initial?: string;
};

/**
 * Estado reutilizable para inputs RUT: formato al escribir, mensajes en español, valor normalizado al guardar.
 */
export function useRutField(options?: UseRutFieldOptions) {
  const [value, setValue] = useState(() => {
    const i = options?.initial?.trim();
    if (!i) return "";
    const n = normalizeRut(i);
    return n.formatted || formatRutWhileTyping(i);
  });
  const [touched, setTouched] = useState(false);

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const next = formatRutWhileTyping(e.target.value);
    setValue(next);
  }, []);

  const onBlur = useCallback(() => {
    setTouched(true);
    const c = cleanRut(value);
    if (!c) {
      setValue("");
      return;
    }
    if (validateRut(value)) {
      setValue(normalizeRut(value).formatted);
    } else {
      setValue(formatRutWhileTyping(value));
    }
  }, [value]);

  const markTouched = useCallback(() => setTouched(true), []);

  const error =
    touched && value.trim() !== "" && !validateRut(value) ? RUT_MESSAGES.invalid : null;
  const helperOk = touched && validateRut(value) ? RUT_MESSAGES.valid : null;

  const reset = useCallback((next?: string) => {
    const i = next?.trim();
    if (!i) {
      setValue("");
      setTouched(false);
      return;
    }
    const n = normalizeRut(i);
    setValue(n.formatted || formatRutWhileTyping(i));
    setTouched(false);
  }, []);

  return {
    value,
    setValue,
    onChange,
    onBlur,
    markTouched,
    touched,
    error,
    helperOk,
    reset,
    isValid: () => validateRut(value),
    /** Valor persistible (formato oficial si es válido; si no, formatted parcial). */
    getSubmitValue: () => {
      if (!cleanRut(value)) return "";
      if (validateRut(value)) return normalizeRut(value).formatted;
      return value.trim();
    },
    /** Solo si el RUT es válido (para validación estricta antes de enviar). */
    getNormalizedStrict: () => (validateRut(value) ? normalizeRut(value) : null),
  };
}
