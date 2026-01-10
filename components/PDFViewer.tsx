import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';

// Ensure worker is set if this component is loaded directly
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  dataUrl: string;
  onPageChange?: (page: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ dataUrl, onPageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.2); // Default fallback
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Inject standard PDF.js text layer CSS with proper transparency
  useEffect(() => {
    const styleId = 'pdf-text-layer-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .textLayer {
          position: absolute;
          text-align: initial;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          line-height: 1.0;
          text-size-adjust: none;
          pointer-events: none;
        }
        .textLayer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
          pointer-events: auto;
        }
        .textLayer ::selection {
          background: rgba(59, 130, 246, 0.3); /* Blue selection with opacity */
          color: transparent;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPageNum(1);
        
        // Calculate automatic "Fit Width" scale
        // We fetch the first page to determine dimensions
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        
        // Get container width, defaulting to window width if ref not ready
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
        const availableWidth = containerWidth - 48; // Account for padding (p-4 = 1rem * 2 + safe margin)
        
        if (availableWidth > 0 && viewport.width > 0) {
            const fitWidthScale = availableWidth / viewport.width;
            // Cap the scale to avoid it being ridiculously huge on massive monitors, 
            // but ensure it fills the space as requested.
            // Minimum 0.8 to readable, Max 2.0 for quality.
            setScale(Math.min(Math.max(fitWidthScale, 0.8), 2.5));
        } else {
            setScale(1.2);
        }

        onPageChange?.(1);
      } catch (error) {
        console.error("Error loading PDF", error);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [dataUrl]); 

  // Handle window resize to adjust scale dynamically if needed? 
  // For now, we stick to initial load scale to prevent jarring jumps, but user can zoom.

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const textLayerDiv = textLayerRef.current;

        // Clear previous text layer
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Render Canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;

          // Render Text Layer
          const textContent = await page.getTextContent();
          const pdfJsAny = pdfjsLib as any;
          
          if (pdfJsAny.renderTextLayer) {
            await pdfJsAny.renderTextLayer({
              textContentSource: textContent,
              container: textLayerDiv,
              viewport: viewport,
              textDivs: []
            }).promise;
          } else if (pdfJsAny.TextLayer) {
             // Support for newer pdfjs-dist versions (v4/v5)
             const textLayer = new pdfJsAny.TextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport: viewport,
             });
             await textLayer.render();
          }
        }
      } catch (err) {
        console.error("Page render error:", err);
      }
    };

    renderPage();
  }, [pdfDoc, pageNum, scale]);

  const changePage = (newPage: number) => {
    const p = Math.max(1, Math.min(numPages, newPage));
    setPageNum(p);
    onPageChange?.(p);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-2 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(pageNum - 1)}
            disabled={pageNum <= 1}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {pageNum} of {numPages}
          </span>
          <button
            onClick={() => changePage(pageNum + 1)}
            disabled={pageNum >= numPages}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <button
             onClick={() => setScale(Math.max(0.5, scale - 0.1))}
             className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
             title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
           <button
             onClick={() => setScale(Math.min(4, scale + 0.1))}
             className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
             title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Viewer Container */}
      <div 
        className="flex-1 overflow-auto flex justify-center p-4 bg-gray-200/50 dark:bg-gray-950" 
        ref={containerRef}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mr-2"></div>
            Loading PDF...
          </div>
        ) : (
          /* Relative container for Canvas + Text Layer */
          <div className="relative shadow-lg bg-white" style={{ height: 'fit-content' }}>
            <canvas ref={canvasRef} className="block" />
            <div ref={textLayerRef} className="textLayer" />
          </div>
        )}
      </div>
    </div>
  );
};