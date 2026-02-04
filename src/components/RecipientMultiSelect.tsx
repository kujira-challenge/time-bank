'use client';

import { useState, useRef } from 'react';
import type { RecipientOption, RecipientType } from '@/types';

type SelectedRecipient = {
  recipient_id: string;
  recipient_type: RecipientType;
};

type RecipientMultiSelectProps = {
  options: RecipientOption[];
  selected: SelectedRecipient[];
  onChange: (recipients: SelectedRecipient[]) => void;
};

export default function RecipientMultiSelect({
  options,
  selected,
  onChange,
}: RecipientMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const userOptions = options.filter((o) => o.type === 'user');
  const guildOptions = options.filter((o) => o.type === 'guild');

  const isSelected = (id: string, type: RecipientType) =>
    selected.some((s) => s.recipient_id === id && s.recipient_type === type);

  const toggle = (id: string, type: RecipientType) => {
    if (isSelected(id, type)) {
      onChange(selected.filter((s) => !(s.recipient_id === id && s.recipient_type === type)));
    } else {
      onChange([...selected, { recipient_id: id, recipient_type: type }]);
    }
  };

  const remove = (id: string, type: RecipientType) => {
    onChange(selected.filter((s) => !(s.recipient_id === id && s.recipient_type === type)));
  };

  const getName = (id: string, type: RecipientType): string => {
    const option = options.find((o) => o.id === id && o.type === type);
    return option?.name || id;
  };

  const filterOptions = (list: RecipientOption[]) => {
    if (!filter) return list;
    const lowerFilter = filter.toLowerCase();
    return list.filter((o) => o.name.toLowerCase().includes(lowerFilter));
  };

  const filteredUsers = filterOptions(userOptions);
  const filteredGuilds = filterOptions(guildOptions);

  return (
    <div className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((s) => (
            <span
              key={`${s.recipient_type}-${s.recipient_id}`}
              className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
                s.recipient_type === 'guild'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {s.recipient_type === 'guild' ? '(組織) ' : ''}
              {getName(s.recipient_id, s.recipient_type)}
              <button
                type="button"
                onClick={() => remove(s.recipient_id, s.recipient_type)}
                className={`focus:outline-none ${
                  s.recipient_type === 'guild'
                    ? 'text-green-600 hover:text-green-800'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                aria-label={`Remove ${getName(s.recipient_id, s.recipient_type)}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder="貢献先を検索して選択..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Dropdown */}
        {isOpen && (filteredUsers.length > 0 || filteredGuilds.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {/* Guild group */}
            {filteredGuilds.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b sticky top-0">
                  組織 / ギルド
                </div>
                {filteredGuilds.map((guild) => (
                  <button
                    key={`guild-${guild.id}`}
                    type="button"
                    onClick={() => {
                      toggle(guild.id, 'guild');
                      inputRef.current?.focus();
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 focus:bg-green-50 focus:outline-none flex items-center gap-2 ${
                      isSelected(guild.id, 'guild') ? 'bg-green-50 text-green-800' : 'text-gray-700'
                    }`}
                  >
                    <span className={`w-4 h-4 inline-flex items-center justify-center rounded border ${
                      isSelected(guild.id, 'guild')
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {isSelected(guild.id, 'guild') && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {guild.name}
                  </button>
                ))}
              </>
            )}

            {/* User group */}
            {filteredUsers.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b sticky top-0">
                  個人
                </div>
                {filteredUsers.map((user) => (
                  <button
                    key={`user-${user.id}`}
                    type="button"
                    onClick={() => {
                      toggle(user.id, 'user');
                      inputRef.current?.focus();
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center gap-2 ${
                      isSelected(user.id, 'user') ? 'bg-blue-50 text-blue-800' : 'text-gray-700'
                    }`}
                  >
                    <span className={`w-4 h-4 inline-flex items-center justify-center rounded border ${
                      isSelected(user.id, 'user')
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {isSelected(user.id, 'user') && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {user.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-500">
        {selected.length} 件選択中 · 複数選択可能
      </p>
    </div>
  );
}
