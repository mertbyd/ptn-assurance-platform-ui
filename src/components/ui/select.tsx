import { forwardRef, type ComponentPropsWithoutRef } from "react";

export const Select = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<"select">>(
  function Select({ children, style, ...props }, ref) {
    return (
      <select
        {...props}
        ref={ref}
        style={{
          background: "#171b26",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          color: "#dce2ee",
          fontSize: 13,
          height: 40,
          outline: "none",
          padding: "0 34px 0 12px",
          width: "100%",
          ...style,
        }}
      >
        {children}
      </select>
    );
  },
);
