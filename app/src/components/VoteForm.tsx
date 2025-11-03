import React, { useState } from 'react';
import { CreateVoteData } from '../types/voting';

interface VoteFormProps {
  onSubmit: (data: CreateVoteData) => void;
  loading: boolean;
}

export const VoteForm: React.FC<VoteFormProps> = ({ onSubmit, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(24);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredOptions = options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const endTime = Math.floor(Date.now() / 1000) + (duration * 3600);
    
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      options: filteredOptions,
      endTime,
    });
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
          maxLength={500}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Options ({options.length}/10)
        </label>
        <div className="space-y-2 mt-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm"
                placeholder={`Option ${index + 1}`}
                required
                maxLength={50}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= 10}
          className="mt-2 text-sm bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          Add Option
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value={1}>1 hour</option>
          <option value={6}>6 hours</option>
          <option value={24}>24 hours</option>
          <option value={168}>7 days</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Vote'}
      </button>
    </form>
  );
};