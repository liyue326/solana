import { useMemo } from 'react';
import { VoteAccount, VoteStats } from '../types/voting';

export const useVoteStats = (vote: VoteAccount | null): VoteStats => {
  return useMemo(() => {
    if (!vote) {
      return { totalVotes: 0, percentages: [] };
    }

    const totalVotes = vote.account.totalVotes;
    const percentages = vote.account.voteCounts.map(count => 
      totalVotes > 0 ? (count / totalVotes) * 100 : 0
    );

    const winningOption = totalVotes > 0 
      ? vote.account.voteCounts.indexOf(Math.max(...vote.account.voteCounts))
      : undefined;

    return {
      totalVotes,
      percentages,
      winningOption,
    };
  }, [vote]);
};