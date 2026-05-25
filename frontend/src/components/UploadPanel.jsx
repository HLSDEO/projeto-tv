import { Upload } from 'lucide-react';
import { useRef } from 'react';

export default function UploadPanel({ onUpload, uploading }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
      <h2 className="text-xl font-semibold mb-4">Nova Mídia</h2>
      <div 
        className="border-2 border-dashed border-zinc-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
        <p className="text-zinc-300 font-medium">Clique para fazer upload</p>
        <p className="text-sm text-zinc-500 mt-2">Suporta Imagens e Vídeos (mp4, webm)</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/mp4,video/webm"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      {uploading && <p className="text-blue-400 mt-4 text-center animate-pulse">Enviando arquivo...</p>}
    </div>
  );
}
