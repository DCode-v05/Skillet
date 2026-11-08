export type Severity = "success" | "warning" | "error" | "info";

export interface NoticeBannerWidget {
  widget: "notice";
  variant: "banner";
  version: "1.0";
  severity: Severity;
  message: string;
  learnMore?: {
    label: string;
    prompt: string;
  };
}

export interface NoticeSourcesWidget {
  widget: "notice";
  variant: "sources";
  version: "1.0";
  title?: string;
  sources: Array<{
    id: string;
    url: string;
    title: string;
    summary?: string;
    domain: string;
  }>;
}

export type NoticeWidget = NoticeBannerWidget | NoticeSourcesWidget;
