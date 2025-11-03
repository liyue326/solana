import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { DaoVotingPlatform } from '../../../target/types/dao_voting_platform';
import idl from '../../../target/idl/dao_voting_platform.json';

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = new Program(
    idl as any,
    new AnchorProvider(connection, wallet as any, {})
  ) as Program<DaoVotingPlatform>;

  return program;
};

export const findVotePda = (authority: web3.PublicKey, title: string, programId: web3.PublicKey) => {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), authority.toBuffer(), Buffer.from(title)],
    programId
  );
};

export const findVoterRecordPda = (vote: web3.PublicKey, voter: web3.PublicKey, programId: web3.PublicKey) => {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('voter'), vote.toBuffer(), voter.toBuffer()],
    programId
  );
};