interface FormLike { values: object; errors: object; submitCount: number; setFieldValue: (field: string, value: unknown, validate?: boolean) => unknown }

/** Wire a Formik field to the string-based inputs here. Errors appear once a submit was attempted. */
export function bind<F extends FormLike>(f: F, name: keyof F['values'] & string) {
  const err = (f.errors as Record<string, unknown>)[name]
  return {
    value: String((f.values as Record<string, unknown>)[name] ?? ''),
    onChange: (v: string) => { void f.setFieldValue(name, v) },
    error: f.submitCount > 0 && typeof err === 'string' ? err : '',
  }
}
