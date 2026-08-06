import { Eye, AlertCircle, Download } from 'lucide-react';
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

      <div className="pdf-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={14} />
          <span>{selectedNote?.files.pdf ? 'Visualizador de PDF' : 'Visualizador OCR'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedNote?.files.pdf && (
            <a 
              href={getFileUrl(selectedNote.files.pdf)}
              download={`${selectedNote.id}.pdf`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#ffffff',
                backgroundColor: '#475569',
                border: '1px solid #64748b',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.backgroundColor = '#2563eb'; 
                e.currentTarget.style.borderColor = '#3b82f6'; 
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.backgroundColor = '#475569'; 
                e.currentTarget.style.borderColor = '#64748b'; 
              }}
              title="Baixar arquivo PDF original da fatura"
            >
              <Download size={14} color="#ffffff" />
            </a>
          )}
          <span>{selectedNote?.id}</span>
        </div>
      </div>
      
      <div className="pdf-wrapper">
        {selectedNote?.files.pdf ? (
          <iframe 
            key={selectedNote.id}
            src={`${getFileUrl(selectedNote.files.pdf)}#toolbar=0&navpanes=0&view=FitH`} 
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
