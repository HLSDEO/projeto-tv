import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export default function UploadPanel({ onUpload, uploading }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validateAndUpload = (file) => {
    setErrorMsg('');
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|mkv)$/i.test(file.name);
    const maxVideoBytes = 100 * 1024 * 1024;
    const maxImageBytes = 15 * 1024 * 1024;

    if (isVideo && file.size > maxVideoBytes) {
      setErrorMsg(`O vídeo "${file.name}" excede o limite máximo de 100 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }
    if (!isVideo && file.size > maxImageBytes) {
      setErrorMsg(`A imagem "${file.name}" excede o limite máximo de 15 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    onUpload(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  return (
    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 select-none">
      <h2 className="text-xl font-semibold mb-4">Nova Mídia</h2>
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
            : 'border-zinc-600 hover:border-blue-550 hover:bg-zinc-850/20 shadow-none'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 transition-all duration-200 ${
          isDragOver ? 'text-blue-400 scale-110' : 'text-zinc-400'
        }`} />
        <p className="text-zinc-300 font-medium">Arrastar arquivo ou clique para fazer upload</p>
        <p className="text-sm text-zinc-550 mt-2">Suporta Imagens (até 15 MB) e Vídeos (mp4, webm - até 100 MB)</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/mp4,video/webm"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg text-center">
          {errorMsg}
        </div>
      )}
      {uploading && <p className="text-blue-400 mt-4 text-center animate-pulse">Enviando arquivo...</p>}
    </div>
  );
}

