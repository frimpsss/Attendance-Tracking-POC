import * as React from "react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "./shared/field";
import { fieldBase } from "./shared/styles";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldControlProps {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { id, label, hint, error, optional, required, containerClassName, className, rows = 4, ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    return (
      <Field
        id={textareaId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        optional={optional}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${textareaId}-description` : undefined}
          className={cn(fieldBase, "min-h-[96px] resize-y px-4 py-3 leading-[22px]", className)}
          {...props}
        />
      </Field>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
