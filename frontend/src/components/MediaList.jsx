import MediaItem from './MediaItem';

export default function MediaList({ media, onUpdate, onDelete, baseURL }) {
  return (
    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
      <h2 className="text-xl font-semibold mb-6">Mídias Cadastradas</h2>
      <div className="space-y-4">
        {media.map((m) => (
          <MediaItem
            key={m.id}
            m={m}
            onUpdate={onUpdate}
            onDelete={onDelete}
            baseURL={baseURL}
          />
        ))}
        {media.length === 0 && (
          <p className="text-center text-zinc-500 py-8">Nenhuma mídia cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
