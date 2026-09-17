import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { readPdfFile } from '@/utils/pdfStorage';

export function PdfBookReader({ uri, title }: { uri: string; title: string }) {
  const pagesRef = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pageCount, setPageCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('This PDF could not be opened in the reader.');

  useEffect(() => {
    let cancelled = false;
    const pages = pagesRef.current;
    if (!pages) return undefined;
    pages.replaceChildren();
    setStatus('loading');
    setPageCount(0);
    setErrorMessage(
      uri.startsWith('blob:')
        ? 'This PDF was saved from an earlier version. Replace it in Publisher Studio to open it.'
        : 'This PDF could not be opened in the reader.',
    );

    const renderPdf = async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const savedFile = uri.startsWith('indexeddb://') ? await readPdfFile(uri) : null;
        if (uri.startsWith('indexeddb://') && !savedFile) {
          throw new Error('The saved PDF is no longer available.');
        }
        const response = savedFile ? null : await fetch(uri);
        if (response && !response.ok) throw new Error(`Unable to load PDF (${response.status})`);
        const bytes = savedFile ? await savedFile.arrayBuffer() : await response!.arrayBuffer();
        const data = new Uint8Array(bytes);
        const document = await pdfjs.getDocument({ data, disableWorker: true } as Parameters<typeof pdfjs.getDocument>[0]).promise;
        if (cancelled) return;
        setPageCount(document.numPages);

        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.45 });
          const pageFrame = window.document.createElement('div');
          pageFrame.style.cssText = 'background:#fff; margin:0 auto 18px; max-width:100%; box-shadow:0 3px 12px rgba(16,24,32,.14);';
          const canvas = window.document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.cssText = 'display:block; width:100%; height:auto;';
          pageFrame.appendChild(canvas);
          pages.appendChild(pageFrame);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Unable to prepare the PDF page.');
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          if (cancelled) return;
        }
        if (!cancelled) setStatus('ready');
      } catch (error) {
        console.error('Feathers Books PDF reader failed', error);
        if (!cancelled) setStatus('error');
      }
    };

    void renderPdf();
    return () => {
      cancelled = true;
      pages.replaceChildren();
    };
  }, [uri]);

  return (
    <View style={styles.stage}>
      {status === 'loading' ? <Text style={styles.message}>Opening {title}…</Text> : null}
      {status === 'error' ? <Text style={styles.message}>{errorMessage}</Text> : null}
      {React.createElement('div', { ref: pagesRef, style: { flex: 1, overflowY: 'auto', padding: 12 } })}
      {status === 'ready' ? <Text style={styles.pageCount}>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#e9e3d8' },
  message: { position: 'absolute', zIndex: 1, alignSelf: 'center', top: 22, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#ffffff', color: '#27343a', fontSize: 12 },
  pageCount: { position: 'absolute', right: 22, bottom: 20, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: '#27343a', color: '#ffffff', fontSize: 10 },
});