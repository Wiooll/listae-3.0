import React from 'react';
import { NumericFormat } from 'react-number-format';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
  return (
    <NumericFormat
      customInput={Input}
      value={value}
      onValueChange={(values) => {
        onChange(values.floatValue || 0);
      }}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      className={cn('text-right', className)}
      {...props}
    />
  );
} 