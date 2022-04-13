import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MeerderePdas } from "./target/types/meerdere_pdas";
import { PublicKey, Keypair }  from "@solana/web3.js";

import chalk from 'chalk';

const program = anchor.workspace.MeerderePdas as Program<MeerderePdas>;
anchor.setProvider(anchor.Provider.local());

interface BedrijfData {
    naam: string,
    desc: string,
    url:  string,
    veri: boolean
}

interface BedrijfDeriver {
    data: BedrijfData,
    adres: PublicKey
}

interface Bedrijf {
    adres: PublicKey,
    bump:  number,
    id:    number
}

let huidigeID = 0;
let bedrijven: Bedrijf[] = []

async function maakDeriver(b: BedrijfData) {
    const base    = Keypair.generate() // wijzelf
    const dataKey = Keypair.generate()
    const data    = b;

    await program.methods
        .maakDeriver(data, dataKey.publicKey)
        .accounts({
            deriver: base.publicKey
        })
        .signers([base])
        .rpc();
    
    const deriver: BedrijfDeriver = {
        data: b,
        adres: base.publicKey
    };

    return deriver
}

async function wijzigDeriver(d: BedrijfDeriver, nieuweData: BedrijfData) {
    await program.methods
        .wijzigDeriverInhoud(nieuweData)
        .accounts({
            deriver: d.adres
        })
        .rpc();
    
    console.log(chalk.magenta("Inhoud van deriver "), chalk.green(d.adres.toBase58()), chalk.magenta(" aangepast."))
}

async function gebruikDeriver(d: BedrijfDeriver, id: number) {
    const [bedrijfPDA, bump] = await PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("bedrijfpda"), Buffer.from([id]), d.adres.toBuffer()],
        program.programId
    )

    await program.methods
        .maakBedrijf(id)
        .accounts({
            deriver: d.adres,
            bedrijf: bedrijfPDA,
        })
        .rpc();
    
    
    const bedrijf: Bedrijf = {
        adres: bedrijfPDA,
        bump: bump,
        id: id
    }

    console.log("Bedrijf aangemaakt (id: " + chalk.green(id) + ", adres: " + chalk.green(bedrijfPDA.toBase58()) + ")")

    return bedrijf
}

async function nieuwBedrijf(d: BedrijfDeriver, b: BedrijfData) {
    if (huidigeID > 255) {
        throw "Maximum aantal bedrijven gederiveerd."
    }

    
    await wijzigDeriver(d, b);
    const bedrijf = await gebruikDeriver(d, huidigeID);
    huidigeID++;
    return bedrijf;
}

async function zoekDataOp(b: Bedrijf) {
    const data = await program.account.bedrijf.fetch(b.adres);
    const obj: BedrijfData = {
        naam: data.naam,
        desc: data.desc,
        url:  data.url,
        veri: data.veri
    }

    return obj
}


async function main() {
    console.log(chalk.yellow("PDA-programma"))

    const voorbeeldBedrijf1: BedrijfData = {
        naam: "Snackbar Rudy",
        desc: "De beste kroketten van Noord-Brabant vind je hier!",
        url:  "https://www.snackbar-rudy.nl",
        veri: true
    }

    const voorbeeldBedrijf2: BedrijfData = {
        naam: "Barry's Schoenenzaak",
        desc: "Comfortabele stappers voor jong en oud.",
        url:  "https://www.barrys-schoenenzaak.nl",
        veri: true
    }

    const deriver = await maakDeriver(voorbeeldBedrijf1);
    console.log("Deriver aangemaakt (adres: " + chalk.green(deriver.adres.toBase58()) + ")")

    for (let i = 0; i < 10; i++) {
        if (i % 2 == 0) {
            bedrijven.push(await nieuwBedrijf(deriver, voorbeeldBedrijf1));
        } else {
            bedrijven.push(await nieuwBedrijf(deriver, voorbeeldBedrijf2));
        }
    }

    for (let bedrijf of bedrijven) {
        console.log(await zoekDataOp(bedrijf))
    }
}

main().then(() => {console.log(chalk.yellow("Programma succesvol beëindigd."))})