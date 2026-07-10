import { Eye, AlertCircle } from 'lucide-react';
import type { Note } from '../types';
import { getFileUrl } from '../services/api';

interface DocumentViewerProps {
  selectedNote: Note | null;
  isDragging: boolean;
}

export const DocumentViewer = ({ selectedNote, isDragging }: DocumentViewerProps) => {
  return (
    <section className="pdf-container" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      {/* Camada invisível protetora: Impede que o iframe engula os eventos do mouse durante o arraste */}
      {isDragging && <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'col-resize' }} />}

      <div className="pdf-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={14} />
          <span>{selectedNote?.files.pdf ? 'Visualizador de PDF' : 'Visualizador OCR'}</span>
        </div>
        <span>{selectedNote?.id}</span>
      </div>
      
      <div className="pdf-wrapper">
        {selectedNote?.files.pdf ? (
          <iframe 
            key={selectedNote.id}
            src={`${getFileUrl(selectedNote.files.pdf)}#toolbar=0`} 
            title="Document Viewer"
            className="fade-in"
          />
        ) : (
          <div className="paper-sheet fade-in" key="no-pdf">
            <div className="no-pdf-message">
              <AlertCircle size={48} />
              <p>PDF original não encontrado nesta pasta.</p>
              <pre className="paper-content">
                {selectedNote?.data.rawText || 'Selecione um documento.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
