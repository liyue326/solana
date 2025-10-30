use anchor_lang::prelude::*;

declare_id!("FKtwMKGRMVRdzJFKMVWYrrh1TwqXfmUnL6LzdZkCzCS2");

#[program]
pub mod dao_voting_platform {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
