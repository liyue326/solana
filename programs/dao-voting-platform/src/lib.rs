use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod dao_voting_platform {
    use super::*;

    /// 创建投票活动 - 所有验证逻辑都在后端
    pub fn create_vote(
        ctx: Context<CreateVote>,
        title: String,
        description: String,
        options: Vec<String>,
        end_time: i64,
    ) -> Result<()> {
        // 输入验证
        require!(title.len() > 0 && title.len() <= 100, VoteError::InvalidTitleLength);
        require!(description.len() <= 500, VoteError::InvalidDescriptionLength);
        require!(options.len() >= 2 && options.len() <= 10, VoteError::InvalidOptionsCount);
        require!(end_time > Clock::get()?.unix_timestamp, VoteError::InvalidEndTime);
        
        for option in &options {
            require!(option.len() > 0 && option.len() <= 50, VoteError::InvalidOptionLength);
        }

        let vote = &mut ctx.accounts.vote;
        
        // 初始化状态
        vote.authority = ctx.accounts.authority.key();
        vote.title = title;
        vote.description = description;
        vote.options = options;
        vote.vote_counts = vec![0; vote.options.len()];
        vote.total_votes = 0;
        vote.created_at = Clock::get()?.unix_timestamp;
        vote.end_time = end_time;
        vote.is_active = true;
        vote.bump = ctx.bumps.vote;

        emit!(VoteCreated {
            vote: vote.key(),
            title: vote.title.clone(),
            authority: vote.authority,
        });

        Ok(())
    }

    /// 投票 - 核心防重复逻辑在后端
    pub fn cast_vote(ctx: Context<CastVote>, option_index: u8) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        let voter_record = &mut ctx.accounts.voter_record;
        let clock = Clock::get()?;

        // 投票状态验证
        require!(vote.is_active, VoteError::VoteEnded);
        require!(clock.unix_timestamp <= vote.end_time, VoteError::VotingPeriodEnded);
        require!((option_index as usize) < vote.options.len(), VoteError::InvalidOptionIndex);
        require!(!voter_record.has_voted, VoteError::AlreadyVoted);

        // 记录投票
        voter_record.voter = ctx.accounts.voter.key();
        voter_record.vote = vote.key();
        voter_record.option_index = option_index;
        voter_record.has_voted = true;
        voter_record.voted_at = clock.unix_timestamp;
        voter_record.bump = ctx.bumps.voter_record;

        // 更新统计（防溢出）
        vote.vote_counts[option_index as usize] = vote.vote_counts[option_index as usize]
            .checked_add(1)
            .ok_or(VoteError::Overflow)?;
        vote.total_votes = vote.total_votes.checked_add(1).ok_or(VoteError::Overflow)?;

        emit!(VoteCast {
            vote: vote.key(),
            voter: voter_record.voter,
            option_index,
        });

        Ok(())
    }

    /// 结束投票 - 权限验证在后端
    pub fn end_vote(ctx: Context<EndVote>) -> Result<()> {
        let vote = &mut ctx.accounts.vote;

        require!(
            vote.authority == ctx.accounts.authority.key(),
            VoteError::Unauthorized
        );
        require!(vote.is_active, VoteError::VoteAlreadyEnded);

        vote.is_active = false;
        vote.end_time = Clock::get()?.unix_timestamp;

        emit!(VoteEnded {
            vote: vote.key(),
            total_votes: vote.total_votes,
        });

        Ok(())
    }

    /// 只读操作：获取投票统计
    pub fn get_vote_stats(ctx: Context<GetVoteStats>) -> Result<()> {
        let vote = &ctx.accounts.vote;
        
        // 记录查询日志（链上可见）
        msg!("Vote stats for: {}", vote.title);
        msg!("Total votes: {}", vote.total_votes);
        
        for (i, count) in vote.vote_counts.iter().enumerate() {
            let percentage = if vote.total_votes > 0 {
                (*count as f64 / vote.total_votes as f64) * 100.0
            } else {
                0.0
            };
            msg!("Option {}: {} votes ({:.1}%)", i, count, percentage);
        }

        Ok(())
    }
}

// 状态定义
#[account]
pub struct Vote {
    pub authority: Pubkey,      // 创建者
    pub title: String,          // 标题
    pub description: String,    // 描述
    pub options: Vec<String>,   // 选项
    pub vote_counts: Vec<u32>,  // 票数统计
    pub total_votes: u32,       // 总票数
    pub created_at: i64,        // 创建时间
    pub end_time: i64,          // 结束时间
    pub is_active: bool,        // 是否活跃
    pub bump: u8,               // PDA bump
}

#[account]
pub struct VoterRecord {
    pub voter: Pubkey,          // 投票人
    pub vote: Pubkey,           // 投票项目
    pub option_index: u8,       // 选择项
    pub has_voted: bool,        // 是否已投票
    pub voted_at: i64,          // 投票时间
    pub bump: u8,
}

// 事件定义
#[event]
pub struct VoteCreated {
    pub vote: Pubkey,
    pub title: String,
    pub authority: Pubkey,
}

#[event]
pub struct VoteCast {
    pub vote: Pubkey,
    pub voter: Pubkey,
    pub option_index: u8,
}

#[event]
pub struct VoteEnded {
    pub vote: Pubkey,
    pub total_votes: u32,
}

// 错误定义
#[error_code]
pub enum VoteError {
    #[msg("Title must be between 1 and 100 characters")]
    InvalidTitleLength,
    #[msg("Description too long")]
    InvalidDescriptionLength,
    #[msg("Must have between 2 and 10 options")]
    InvalidOptionsCount,
    #[msg("Option must be between 1 and 50 characters")]
    InvalidOptionLength,
    #[msg("End time must be in the future")]
    InvalidEndTime,
    #[msg("Vote has ended")]
    VoteEnded,
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Vote already ended")]
    VoteAlreadyEnded,
    #[msg("Math overflow")]
    Overflow,
}

// 账户验证结构
#[derive(Accounts)]
#[instruction(title: String, description: String, options: Vec<String>)]
pub struct CreateVote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = Vote::space(&title, &description, &options),
        seeds = [b"vote", authority.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub vote: Account<'info, Vote>,
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VoterRecord::INIT_SPACE,
        seeds = [b"voter", vote.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub voter_record: Account<'info, VoterRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndVote<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub vote: Account<'info, Vote>,
}

#[derive(Accounts)]
pub struct GetVoteStats<'info> {
    pub vote: Account<'info, Vote>,
}

// 为账户实现空间计算
impl Vote {
    pub const INIT_SPACE: usize = 8 + 32 + 8 + 8 + 8 + 1 + 1; // 基础空间
    
    pub fn space(title: &str, description: &str, options: &[String]) -> usize {
        Self::INIT_SPACE
            + 4 + title.len()          // title: String
            + 4 + description.len()    // description: String  
            + 4 + options.iter().map(|o| 4 + o.len()).sum::<usize>() // options: Vec<String>
            + 4 + options.len() * 4    // vote_counts: Vec<u32>
    }
}