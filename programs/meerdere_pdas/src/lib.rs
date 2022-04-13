use anchor_lang::prelude::*;

declare_id!("EoMAmx5jtLjhPzBfqL65rwx58NQW7Y2wdSkk3LnnwrEE");

#[program]
pub mod meerdere_pdas {
    use super::*;

    pub fn maak_deriver(ctx: Context<MaakDeriver>, data: Bedrijf, pda_adres: Pubkey) -> Result<()> {
        let deriver = &mut ctx.accounts.deriver;

        deriver.set_inner(BedrijfDeriver::vanaf_bedrijf(data, pda_adres));
        
        Ok(())
    }

    pub fn maak_bedrijf(ctx: Context<MaakBedrijf>, _seed: u8) -> Result<()> {
        let bedrijf = &mut ctx.accounts.bedrijf;
        let data    = &mut ctx.accounts.deriver;

        bedrijf.naam = data.naam.clone();
        bedrijf.desc = data.desc.clone();
        bedrijf.url  = data.url.clone();
        bedrijf.veri = data.veri;

        Ok(())
    }

    pub fn wijzig_deriver_inhoud(ctx: Context<WijzigDeriverInhoud>, nieuwe_data: Bedrijf) -> Result<()> {
        let deriver = &mut ctx.accounts.deriver;

        deriver.set_inner(BedrijfDeriver::vanaf_bedrijf(nieuwe_data, deriver.adres));

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MaakDeriver<'info> {
    #[account(
        init,
        payer = gebruiker,
        space = 8 + BedrijfDeriver::space()
    )]
    deriver: Account<'info, BedrijfDeriver>,
    
    #[account(mut)]
    gebruiker: Signer<'info>,
    system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(id: u8)]
pub struct MaakBedrijf<'info> {
    deriver: Account<'info, BedrijfDeriver>,

    #[account(
        init,
        payer = gebruiker,
        space = 8 + Bedrijf::space(),
        seeds = [
            "bedrijfpda".as_bytes(), // &[u8; 10] 
            &id.to_le_bytes(),       // &[u8; 1]
            deriver.key().as_ref()   // &[u8; 32]
        ],
        bump
    )]
    bedrijf: Account<'info, Bedrijf>,

    #[account(mut)]
    gebruiker: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WijzigDeriverInhoud<'info> {
    #[account(mut)]
    deriver: Account<'info, BedrijfDeriver>,

    #[account(mut)]
    gebruiker: Signer<'info>,
}

#[account]
pub struct Bedrijf {
    naam: String,
    desc: String,
    url:  String,
    veri: bool,
}

impl Bedrijf {
    fn space() -> usize {
        4 + 50  +
        4 + 200 + 
        4 + 50  +
        1
    }
}

#[account]
pub struct BedrijfDeriver {
    naam: String,
    desc: String,
    url:  String,
    veri: bool,

    adres: Pubkey
}

impl BedrijfDeriver {
    fn space() -> usize {
        4 + 50  +
        4 + 200 + 
        4 + 50  +
        1 + 
        32
    }

    fn vanaf_bedrijf(b: Bedrijf, p: Pubkey) -> Self {
        Self {
            naam: b.naam,
            desc: b.desc,
            url:  b.url,
            veri: b.veri,

            adres: p
        }
    }
}