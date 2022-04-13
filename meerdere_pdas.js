"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const chalk_1 = __importDefault(require("chalk"));
const program = anchor.workspace.MeerderePdas;
anchor.setProvider(anchor.Provider.local());
let huidigeID = 0;
let bedrijven = [];
function maakDeriver(b) {
    return __awaiter(this, void 0, void 0, function* () {
        const base = web3_js_1.Keypair.generate(); // wijzelf
        const dataKey = web3_js_1.Keypair.generate();
        const data = b;
        yield program.methods
            .maakDeriver(data, dataKey.publicKey)
            .accounts({
            deriver: base.publicKey
        })
            .signers([base])
            .rpc();
        const deriver = {
            data: b,
            adres: base.publicKey
        };
        return deriver;
    });
}
function wijzigDeriver(d, nieuweData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield program.methods
            .wijzigDeriverInhoud(nieuweData)
            .accounts({
            deriver: d.adres
        })
            .rpc();
        console.log(chalk_1.default.magenta("Inhoud van deriver "), chalk_1.default.green(d.adres.toBase58()), chalk_1.default.magenta(" aangepast."));
    });
}
function gebruikDeriver(d, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const [bedrijfPDA, bump] = yield web3_js_1.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("bedrijfpda"), Buffer.from([id]), d.adres.toBuffer()], program.programId);
        yield program.methods
            .maakBedrijf(id)
            .accounts({
            deriver: d.adres,
            bedrijf: bedrijfPDA,
        })
            .rpc();
        const bedrijf = {
            adres: bedrijfPDA,
            bump: bump,
            id: id
        };
        console.log("Bedrijf aangemaakt (id: " + chalk_1.default.green(id) + ", adres: " + chalk_1.default.green(bedrijfPDA.toBase58()) + ")");
        return bedrijf;
    });
}
function nieuwBedrijf(d, b) {
    return __awaiter(this, void 0, void 0, function* () {
        if (huidigeID > 255) {
            throw "Maximum aantal bedrijven gederiveerd.";
        }
        yield wijzigDeriver(d, b);
        const bedrijf = yield gebruikDeriver(d, huidigeID);
        huidigeID++;
        return bedrijf;
    });
}
function zoekDataOp(b) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield program.account.bedrijf.fetch(b.adres);
        const obj = {
            naam: data.naam,
            desc: data.desc,
            url: data.url,
            veri: data.veri
        };
        return obj;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.yellow("PDA-programma"));
        const voorbeeldBedrijf1 = {
            naam: "Snackbar Rudy",
            desc: "De beste kroketten van Noord-Brabant vind je hier!",
            url: "https://www.snackbar-rudy.nl",
            veri: true
        };
        const voorbeeldBedrijf2 = {
            naam: "Barry's Schoenenzaak",
            desc: "Comfortabele stappers voor jong en oud.",
            url: "https://www.barrys-schoenenzaak.nl",
            veri: true
        };
        const deriver = yield maakDeriver(voorbeeldBedrijf1);
        console.log("Deriver aangemaakt (adres: " + chalk_1.default.green(deriver.adres.toBase58()) + ")");
        for (let i = 0; i < 10; i++) {
            if (i % 2 == 0) {
                bedrijven.push(yield nieuwBedrijf(deriver, voorbeeldBedrijf1));
            }
            else {
                bedrijven.push(yield nieuwBedrijf(deriver, voorbeeldBedrijf2));
            }
        }
        for (let bedrijf of bedrijven) {
            console.log(yield zoekDataOp(bedrijf));
        }
    });
}
main().then(() => { console.log(chalk_1.default.yellow("Programma succesvol beëindigd.")); });
