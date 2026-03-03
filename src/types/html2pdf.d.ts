declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number]
    filename?: string
    image?: { type?: string; quality?: number }
    html2canvas?: {
      scale?: number
      useCORS?: boolean
      logging?: boolean
    }
    jsPDF?: {
      unit?: string
      format?: string | [number, number]
      orientation?: 'portrait' | 'landscape'
    }
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf
    from(element: HTMLElement | string, type?: 'element' | 'string'): Html2Pdf
    save(): Promise<void>
    output(type: string, options?: object): Promise<unknown>
    toPdf(): Html2Pdf
    get(type: string): Promise<unknown>
  }

  function html2pdf(): Html2Pdf

  export default html2pdf
}
