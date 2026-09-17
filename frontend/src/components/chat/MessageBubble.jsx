import { Archive, Check, CheckCheck, FilePenLine, FileText, Paperclip, ShieldCheck } from 'lucide-react'

export default function MessageBubble({ message, decryptedContent, isOwn }) {
  const isFile = message.message_type === 'file'
  const fileName = message.file_name || ''
  const fileUrl = message.file_url || ''
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)

  const timeStr = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl overflow-hidden ${
          'bg-butter text-burgundy-500 rounded-br-sm rounded-bl-sm'
        }`}>

          {isFile && isImage ? (
            <div>
              <a href={`http://localhost:8000${fileUrl.replace('/api/v1', '')}`} target="_blank" rel="noopener noreferrer">
                <img
                  src={`http://localhost:8000${fileUrl}`}
                  alt={fileName}
                  className="max-w-xs max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
              <p className="text-xs px-3 py-1 text-burgundy-400">
                {fileName} · {message.file_size}
              </p>
            </div>

          ) : isFile ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="text-burgundy-500">
                {/\.pdf$/i.test(fileName) ? <FileText size={24} /> :
                 /\.(doc|docx)$/i.test(fileName) ? <FilePenLine size={24} /> :
                 /\.(zip|rar)$/i.test(fileName) ? <Archive size={24} /> : <Paperclip size={24} />}
              </div>
              <div>
                <a href={`http://localhost:8000${fileUrl.replace('/api/v1', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm underline block">
                  {fileName || 'Download file'}
                </a>
                {message.file_size && (
                  <p className="text-xs mt-0.5 text-burgundy-400">
                    {message.file_size}
                  </p>
                )}
              </div>
            </div>

          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-4 py-2.5">
              {decryptedContent || <span className="opacity-60 italic">Mendekripsi...</span>}
            </p>
          )}
        </div>

        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-burgundy-400 text-xs">{timeStr}</span>
          {isOwn && (
            message.status === 'read' || message.status === 'delivered'
              ? <CheckCheck size={14} strokeWidth={2} className="text-burgundy-400" />
              : <Check size={14} strokeWidth={2} className="text-burgundy-400" />
          )}
          {message.message_hash && (
            <ShieldCheck size={14} strokeWidth={2} className="text-burgundy-400" title="Integrity verified" />
          )}
        </div>
      </div>
    </div>
  )
}