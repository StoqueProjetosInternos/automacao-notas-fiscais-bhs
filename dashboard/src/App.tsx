import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  FileText, 
  Save, 
  RefreshCcw, 
  Search, 
  Database,
  Eye,
  Check,
  AlertCircle,
  XCircle
} from 'lucide-react'
import './App.css'

interface Note {
  id: string;
  fileName: string;
  data: any;
  files: {
    json: string;
    pdf: string | null;
    txt: string | null;
  }
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const API_URL = 'http://localhost:3001'

  const [isApiOnline, setIsApiOnline] = useState(true)

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notes`)
      setNotes(response.data)
      setIsApiOnline(true)
      if (response.data.length > 0 && !selectedNote) {
        handleSelectNote(response.data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar notas', error)
      setIsApiOnline(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setFormData(JSON.parse(JSON.stringify(note.data)))
  }

  const handleInputChange = (path: string[], value: string) => {
    const newFormData = JSON.parse(JSON.stringify(formData));
    let current = newFormData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setFormData(newFormData);
  }

  const handleSave = async (statusOverride?: string) => {
    if (!selectedNote) return
    setLoading(true)
    try {
      const finalData = { ...formData }
      if (statusOverride) finalData.status = statusOverride;
      
      await axios.post(`${API_URL}/api/notes/${selectedNote.id}`, finalData)
      await fetchNotes()
      // Atualiza o formulário local para refletir o status novo
      setFormData(finalData);
      alert(statusOverride === 'validado' ? 'Nota validada com sucesso!' : 'Alterações salvas!')
    } catch (error) {
      alert('Erro ao salvar os dados')
    } finally {
      setLoading(false)
    }
  }

  const filteredNotes = notes.filter(n => 
    n.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const labelMap: Record<string, string> = {
    supplier: 'Fornecedor',
    payer: 'Pagador',
    name: 'Nome / Razão Social',
    cnpjCpf: 'CNPJ/CPF',
    financial: 'Dados Financeiros',
    totalValue: 'Valor Total',
    originalValue: 'Valor Original',
    chargedValue: 'Valor Cobrado',
    dueDate: 'Vencimento',
    issueDate: 'Data de Emissão',
    competenceDate: 'Competência',
    taxes: 'Impostos Retidos',
    iss: 'ISS',
    irrf: 'IRRF',
    pis: 'PIS',
    cofins: 'COFINS',
    csll: 'CSLL',
    document: 'Documento',
    number: 'Número',
    barcode: 'Código de Barras / Linha Digitável',
    type: 'Tipo de Documento',
    additionalInfo: 'Informações Adicionais',
    documentIdentifiers: 'Identificadores',
    documentType: 'Tipo do Documento',
    documentNumber: 'Número do Documento',
    documentSeries: 'Série do Documento',
    supplierAddress: 'Endereço do Fornecedor',
    payerAddress: 'Endereço do Pagador',
    deliveryAddress: 'Endereço de Entrega',
    operationNature: 'Natureza da Operação',
    authorizationProtocol: 'Protocolo de Autorização',
    products: 'Produtos / Serviços',
    observations: 'Observações',
    street: 'Rua / Logradouro',
    neighborhood: 'Bairro',
    city: 'Cidade',
    state: 'Estado',
    cep: 'CEP',
    phone: 'Telefone',
    email: 'E-mail',
    code: 'Código',
    description: 'Descrição',
    ncmSh: 'NCM/SH',
    cst: 'CST',
    cfop: 'CFOP',
    unit: 'Unidade',
    quantity: 'Quantidade',
    unitValue: 'Valor Unitário',
    bcIcms: 'Base de Cálculo ICMS',
    vIcms: 'Valor ICMS',
    vIpi: 'Valor IPI',
    aliquotaIcms: 'Alíquota ICMS',
    aliquotaIpi: 'Alíquota IPI',
    time: 'Hora',
    date: 'Data',
    danfeType: 'Tipo de DANFE'
  };

  const getLabel = (key: string) => {
    // Se for um índice de array (número), retornamos formatado
    if (!isNaN(Number(key))) return `Item ${parseInt(key) + 1}`;
    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase();
  };

  const renderRecursiveFields = (obj: any, path: string[] = []) => {
    if (!obj) return null;
    
    return Object.keys(obj).map(key => {
      const currentPath = [...path, key];
      const value = obj[key];

      // Caso seja um objeto (mas não array) - Renderiza um Card/Seção
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={currentPath.join('.')} className="section-card">
            <span className="section-title">{getLabel(key)}</span>
            {renderRecursiveFields(value, currentPath)}
          </div>
        );
      }

      // Caso seja um Array (Ex: Lista de Produtos ou Observações)
      if (Array.isArray(value)) {
        return (
          <div key={currentPath.join('.')} className="section-card array-section">
            <span className="section-title">{getLabel(key)}</span>
            {value.map((item, index) => {
              const itemPath = [...currentPath, index.toString()];
              if (typeof item === 'object') {
                return (
                  <div key={itemPath.join('.')} className="array-item-card">
                    <span className="item-index-label">{getLabel(index.toString())}</span>
                    {renderRecursiveFields(item, itemPath)}
                  </div>
                );
              }
              return (
                <div key={itemPath.join('.')} className="field-group">
                  <input 
                    className="field-input"
                    type="text" 
                    value={item || ''} 
                    onChange={(e) => handleInputChange(itemPath, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        );
      }

      if (key === 'rawText' || key === 'status') return null;

      // Campo Simples
      return (
        <div key={currentPath.join('.')} className="field-group">
          <label className="field-label">{getLabel(key)}</label>
          <input 
            className="field-input"
            type="text" 
            value={value !== undefined && value !== null ? value : ''} 
            onChange={(e) => handleInputChange(currentPath, e.target.value)}
          />
        </div>
      );
    });
  }

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <img 
            src="https://stoque.com.br/wp-content/uploads/2025/12/Sotque-Lockup-Principal.svg" 
            alt="Stoque" 
            width="120" 
            height="34"
            style={{ display: 'block' }}
          />
          <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#6b7280', fontWeight: 500, borderLeft: '1px solid #e5e7eb', paddingLeft: '12px' }}>
            Automação Fiscal
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={fetchNotes}>
            <RefreshCcw size={14} />
            Sincronizar
          </button>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '4px 12px', 
            background: isApiOnline ? '#f3f4f6' : '#fef2f2', 
            borderRadius: '20px',
            border: `1px solid ${isApiOnline ? 'transparent' : '#fee2e2'}`,
            transition: 'all 0.3s'
          }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: isApiOnline ? '#10b981' : '#ef4444',
              boxShadow: isApiOnline ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
            }} />
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: isApiOnline ? '#111827' : '#ef4444' 
            }}>
              {isApiOnline ? 'API Online' : 'API Offline'}
            </span>
          </div>
        </div>
      </header>

      <div className="content-area">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#9ca3af' }} />
              <input 
                className="search-box" 
                placeholder="Pesquisar arquivos..." 
                style={{ paddingLeft: '2.25rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="note-list">
            {filteredNotes.map(note => (
              <div 
                key={note.id} 
                className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                onClick={() => handleSelectNote(note)}
              >
                <div className="note-item-title">{note.id}</div>
                <div className="note-item-meta">
                  <span>
                    <span className={`status-dot status-${note.data.status || 'pendente'}`} />
                    {note.data.status || 'pendente'}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    R$ {note.data.financial?.originalValue || note.data.valorTotal || '0,00'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main">
          <section className="pdf-container">
            <div className="pdf-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={14} />
                <span>{selectedNote?.files.pdf || 'Visualizador OCR'}</span>
              </div>
              <span>{selectedNote?.id}</span>
            </div>
            
            <div className="pdf-wrapper">
              {selectedNote?.files.pdf ? (
                <iframe 
                  src={`${API_URL}/files/${selectedNote.files.pdf}#toolbar=0`} 
                  title="Document Viewer"
                />
              ) : (
                <div className="paper-sheet">
                  <pre className="paper-content">
                    {selectedNote?.data.rawText || 'Selecione um documento.'}
                  </pre>
                </div>
              )}
            </div>
          </section>

          <section className="editor">
            <div className="editor-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', fontWeight: 700 }}>
                    <FileText size={18} color="#2563eb" />
                    Curadoria de Dados
                  </h2>
                </div>
                <div className={`status-badge status-${formData?.status || 'pendente'}`} style={{ 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '0.65rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  background: formData?.status === 'validado' ? '#ecfdf5' : '#fff7ed',
                  color: formData?.status === 'validado' ? '#059669' : '#d97706',
                  border: `1px solid ${formData?.status === 'validado' ? '#a7f3d0' : '#fed7aa'}`
                }}>
                  {formData?.status || 'pendente'}
                </div>
              </div>
            </div>

            <div className="editor-content">
              {formData ? renderRecursiveFields(formData) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '6rem' }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p>Selecione um item.</p>
                </div>
              )}
            </div>

            <div className="action-bar">
              <button 
                className="btn btn-danger" 
                onClick={() => handleSave('erro')}
                disabled={loading || !selectedNote}
              >
                <XCircle size={14} />
                Reprovar
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => handleSave()}
                disabled={loading || !selectedNote}
              >
                <Save size={14} />
                Salvar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleSave('validado')}
                disabled={loading || !selectedNote || formData?.status === 'validado'}
              >
                <Check size={14} />
                {formData?.status === 'validado' ? 'Validado' : 'Aprovar'}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
