import React from 'react';
import { VoteAccount } from '../types/voting';
import { useVoteStats } from '../hooks/useVoteStats';

interface VoteCardProps {
  vote: VoteAccount;
  onVote: (optionIndex: number) => void;
  onEndVote: () => void;
  canVote: boolean;
  canEndVote: boolean;
  loading: boolean;
}

export const VoteCard: React.FC<VoteCardProps> = ({
  vote,
  onVote,
  onEndVote,
  canVote,
  canEndVote,
  loading,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const stats = useVoteStats(vote);

  const isActive = vote.account.is_active && Date.now() / 1000 < vote.account.end_time;

  const handleVote = () => {
    if (selectedOption !== null) {
      onVote(selectedOption);
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{vote.account.title}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Ended'}
          </span>
          {canEndVote && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Creator
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-4">{vote.account.description}</p>

      <div className="space-y-3 mb-4">
        {vote.account.options.map((option, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span>{option}</span>
              <span>
                {vote.account.voteCounts[index]} votes ({stats.percentages[index].toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.percentages[index]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Total votes: {stats.totalVotes} • Created by: {vote.account.authority.slice(0, 8)}...
      </div>

      {isActive && canVote && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {vote.account.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={`p-2 border rounded text-sm ${
                  selectedOption === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            onClick={handleVote}
            disabled={loading || selectedOption === null}
            className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Voting...' : 'Vote'}
          </button>
        </div>
      )}

      {isActive && canEndVote && (
        <button
          onClick={onEndVote}
          className="w-full bg-red-500 text-white py-2 rounded mt-2"
        >
          End Vote
        </button>
      )}
    </div>
  );
};