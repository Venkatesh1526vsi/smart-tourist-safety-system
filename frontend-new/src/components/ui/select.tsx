import * as React from "react"
import { cn } from "@/lib/utils"

// Simplified Select components without radix dependencies
const defaultSelectClassName = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const Select = ({ 
  children, 
  value, 
  onValueChange 
}: { 
  children: React.ReactNode; 
  value: string; 
  onValueChange?: (value: string) => void; 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value);
  };

  let triggerClassName = "";
  let placeholder: string | undefined;
  const options: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === SelectTrigger) {
      triggerClassName = child.props.className ?? "";
      React.Children.forEach(child.props.children, (triggerChild) => {
        if (!React.isValidElement(triggerChild)) return;
        if (triggerChild.type === SelectValue) {
          placeholder = triggerChild.props.placeholder;
        }
      });
    }

    if (child.type === SelectContent) {
      React.Children.forEach(child.props.children, (contentChild) => {
        if (!React.isValidElement(contentChild)) return;
        if (contentChild.type === SelectItem) {
          options.push(<option key={contentChild.props.value} value={contentChild.props.value}>{contentChild.props.children}</option>);
        }
      });
    }

    if (child.type === SelectItem) {
      options.push(<option key={child.props.value} value={child.props.value}>{child.props.children}</option>);
    }
  });

  return (
    <select
      value={value}
      onChange={handleChange}
      className={cn(defaultSelectClassName, triggerClassName)}
    >
      {placeholder ? <option value="" disabled>{placeholder}</option> : null}
      {options}
    </select>
  );
};

const SelectTrigger = ({ 
  children, 
  className
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn(defaultSelectClassName, className)}>
      {children}
    </div>
  );
};

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <>{placeholder}</>;
};

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
    {children}
  </div>;
};

const SelectItem = ({ children, value }: { children: React.ReactNode; value: string }) => {
  return <option value={value}>{children}</option>;
};

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}