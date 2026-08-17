import React from "react";

/* Her bileşen render ettiği DOM elemanının kendi prop kümesini alır: `className` ve `style`
 * ayrı ayrı okunup birleştirildiği için kalan proplar elemana olduğu gibi yayılır. */
type DivProps = React.ComponentPropsWithoutRef<"div">;
type HeadingProps = React.ComponentPropsWithoutRef<"h3">;
type ParagraphProps = React.ComponentPropsWithoutRef<"p">;

export function Card({ children, className, style, ...props }: DivProps) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        color: "#eaedf4",
        display: "flex",
        flexDirection: "column",
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, style, ...props }: DivProps) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 6, padding: "24px 24px 16px", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, style, ...props }: HeadingProps) {
  return (
    <h3
      className={className}
      style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "#eaedf4", margin: 0, ...style }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, style, ...props }: ParagraphProps) {
  return (
    <p
      className={className}
      style={{ fontSize: 13, color: "rgba(255,255,255,0.36)", margin: 0, ...style }}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className, style, ...props }: DivProps) {
  return (
    <div
      className={className}
      style={{ padding: "0 24px 24px", flex: 1, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className, style, ...props }: DivProps) {
  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
