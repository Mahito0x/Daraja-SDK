import { PageBreak as FormePageBreak } from "@formepdf/react";

import type { PDFComponentProps } from "@/types/pdf-components";

export interface PageBreakProps extends Omit<PDFComponentProps, "children"> {
  children?: never;
}

export const PageBreak = (_props: PageBreakProps) => <FormePageBreak />;
