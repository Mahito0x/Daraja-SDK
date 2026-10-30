import {
  Document as FormeDocument,
  Fixed as FormeFixed,
  Image as FormeImage,
  Link as FormeLink,
  Page as FormePage,
  PageBreak as FormePageBreak,
  Text as FormeText,
  View as FormeView,
} from "@formepdf/react";
import type { ReactNode } from "react";

export type Style = Record<string, unknown>;

export const StyleSheet = {
  create<T extends Record<string, Style>>(styles: T): T {
    return styles;
  },
};

type StyleInput = Style | StyleInput[] | false | null | undefined;

const mergeStyleInput = (target: Style, input: StyleInput): void => {
  if (Array.isArray(input)) {
    for (const item of input) {
      mergeStyleInput(target, item);
    }
  } else if (input) {
    Object.assign(target, input);
  }
};

export const flatten = (style?: StyleInput): Style | undefined => {
  if (!style) {
    return undefined;
  }
  const merged: Style = {};
  mergeStyleInput(merged, style);
  return merged;
};

export const View = ({
  children,
  style,
  wrap,
  fixed,
  break: pageBreak,
  href,
}: {
  children?: ReactNode;
  style?: StyleInput;
  wrap?: boolean;
  fixed?: boolean;
  break?: boolean;
  minPresenceAhead?: number;
  href?: string;
}) => {
  const view = (
    <FormeView href={href} style={flatten(style) as never} wrap={wrap}>
      {children}
    </FormeView>
  );
  const content = pageBreak ? (
    <>
      <FormePageBreak />
      {view}
    </>
  ) : (
    view
  );

  return fixed ? <FormeFixed position="header">{content}</FormeFixed> : content;
};

export const Fixed = ({
  children,
  position,
  style,
}: {
  children?: ReactNode;
  position: "header" | "footer";
  style?: StyleInput;
}) => (
  <FormeFixed position={position} style={flatten(style) as never}>
    {children}
  </FormeFixed>
);

export const Text = ({
  children,
  style,
  href,
}: {
  children?: ReactNode;
  style?: StyleInput;
  href?: string;
}) => (
  <FormeText href={href} style={flatten(style) as never}>
    {children}
  </FormeText>
);

export const Image = ({
  src,
  style,
  ...props
}: {
  src: string | { uri: string };
  width?: number;
  height?: number;
  alt?: string;
  href?: string;
  style?: StyleInput;
}) => (
  <FormeImage
    src={typeof src === "string" ? src : src.uri}
    style={flatten(style) as never}
    {...props}
  />
);

export const Link = ({
  src,
  children,
  style,
}: {
  src: string;
  children?: ReactNode;
  style?: StyleInput;
}) => (
  <FormeLink href={src} style={flatten(style) as never}>
    {children}
  </FormeLink>
);

export const Document = ({
  children,
  title,
  author,
  style,
}: {
  children?: ReactNode;
  title?: string;
  author?: string;
  style?: StyleInput;
}) => (
  <FormeDocument title={title} author={author} style={flatten(style) as never}>
    {children}
  </FormeDocument>
);

export const Page = ({
  children,
  size,
  style,
}: {
  children?: ReactNode;
  size?: string | { width: number; height: number };
  style?: StyleInput;
}) => (
  <FormePage size={size as never} style={flatten(style) as never}>
    {children}
  </FormePage>
);
