export interface VoteAccount {
    publicKey: string;
    account: {
      authority: string;
      title: string;
      description: string;
      options: string[];
      voteCounts: number[];
      totalVotes: number;
      created_at: number;
      end_time: number;
      is_active: boolean;
    };
  }
  
  export interface CreateVoteData {
    title: string;
    description: string;
    options: string[];
    endTime: number;
  }
  
  export interface VoteStats {
    totalVotes: number;
    percentages: number[];
    winningOption?: number;
  }