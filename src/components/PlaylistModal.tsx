type Props = {
  playlistName: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function PlaylistModal({
  playlistName,
  onNameChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow">Новый плейлист</div>
        <h3>Собрать свою подборку</h3>
        <input
          value={playlistName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Например: Вечерние сказки"
        />
        <div className="row-actions end">
          <button type="button" className="ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="primary" onClick={onSubmit}>
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
