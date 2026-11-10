/* eslint-disable react-refresh/only-export-components */

export const getFieldClass = (hasError: boolean) =>
  `w-full rounded-full border bg-white py-2.5 pl-11 text-sm outline-none transition-colors ${
    hasError ? 'border-red-400 focus:border-red-500' : 'border-line focus:border-brand'
  }`

export const errorClass = 'mt-2 text-xs font-medium text-red-600'

export const RequiredMark = () => <span className="text-red-500">*</span>
