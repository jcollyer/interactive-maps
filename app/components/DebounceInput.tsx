import React, { FC, InputHTMLAttributes, useEffect, useState } from "react";

type DebouncedInputProps = {
  debounce?: number;
  value: string;
  onChange: (value: any) => void;
  className?: string;
  placeholder: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">;

const DebouncedInput: FC<DebouncedInputProps> = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      className="flex-1 border border-gray-300 p-1 rounded ml-2"
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

export default DebouncedInput;
