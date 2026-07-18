import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocket } from '../context/SocketContext';
import EmojiPicker from 'emoji-picker-react';
import { Smile, Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);

  const { activeChat, sendMessage } = useChatStore();
  const { activeGroup, sendGroupMessage } = useGroupStore();
  const { user: currentUser } = useAuthStore();
  
  const socket = useSocket();
  const pickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setText(e.target.value);

    // Forward typing events
    if (socket) {
      if (activeChat) {
        const partnerId = activeChat?.otherParticipant?._id;
        if (partnerId) {
          socket.emit('typing', { receiverId: partnerId, isTyping: true });
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { receiverId: partnerId, isTyping: false });
          }, 1500);
        }
      } else if (activeGroup) {
        socket.emit('groupTyping', {
          groupId: activeGroup._id,
          isTyping: true,
          username: currentUser?.username,
          name: currentUser?.name,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('groupTyping', {
            groupId: activeGroup._id,
            isTyping: false,
            username: currentUser?.username,
            name: currentUser?.name,
          });
        }, 1500);
      }
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedImage) return;

    setSending(true);

    // Clear typing status on submit
    if (socket) {
      if (activeChat) {
        const partnerId = activeChat?.otherParticipant?._id;
        socket.emit('typing', { receiverId: partnerId, isTyping: false });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      } else if (activeGroup) {
        socket.emit('groupTyping', {
          groupId: activeGroup._id,
          isTyping: false,
          username: currentUser?.username,
          name: currentUser?.name,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    }

    const messageText = text;
    setText('');
    handleRemoveImage();
    setShowEmojiPicker(false);

    if (activeGroup) {
      // Build Multipart Form Data for group message (allows image sharing)
      const formData = new FormData();
      formData.append('content', messageText);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await sendGroupMessage(activeGroup._id, formData);
      setSending(false);
      if (!res.success) {
        setText(messageText);
        toast.error(res.message || 'Failed to send group message');
      }
    } else if (activeChat) {
      const res = await sendMessage(activeChat._id, messageText);
      setSending(false);
      if (!res.success) {
        setText(messageText);
        toast.error('Failed to send message');
      }
    } else {
      setSending(false);
    }
  };

  return (
    <div className="w-full relative">
      {/* File Preview Thumbnail bar */}
      {imagePreview && (
        <div className="absolute bottom-16 left-0 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 flex items-center space-x-3 z-30 shadow-soft">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
            <img src={imagePreview} alt="upload preview" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{selectedImage?.name}</p>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Ready to upload</p>
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="p-1 hover:bg-slate-250 dark:hover:bg-slate-850 rounded-lg text-slate-450 hover:text-red-500 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2 w-full">
        {/* Attachment & Emoji Controls */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Emoji Trigger */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-2xl transition duration-200 ${
                showEmojiPicker
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
              title="Add Emoji"
            >
              <Smile className="h-5 w-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-14 left-0 z-50 shadow-premium rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={380}
                  searchDisabled
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                />
              </div>
            )}
          </div>

          {/* Group Photo Attachment Trigger (Only active when sending to a group) */}
          {activeGroup && (
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 transition duration-200"
                title="Attach Image"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          placeholder={activeGroup ? "Type a group message safely..." : "Type a message safely..."}
          className="flex-1 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition font-medium text-slate-800 dark:text-slate-100"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedImage) || sending}
          className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-white disabled:text-slate-400 dark:disabled:text-slate-650 rounded-2xl shadow-soft hover:shadow-premium disabled:shadow-none transition duration-200 shrink-0"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
