import { Address } from "@ton/core";
import { useJettonContent, useJettonWallet, useJettonWalletAddress, useNetwork } from "..";
import { t } from "../../../i18n/t";
import { Jetton } from "../../types";

export function useJetton(owner: Address | string, master?: Address | string, suspense?: boolean): Jetton | null {
    const { isTestnet: testOnly } = useNetwork();
    const masterStr = typeof master === 'string' ? master : (master?.toString({ testOnly }) ?? null);
    const ownerStr = typeof owner === 'string' ? owner : owner.toString({ testOnly });

    const content = useJettonContent(masterStr, suspense);
    const walletStr = useJettonWalletAddress(masterStr, ownerStr, suspense).data;
    const wallet = useJettonWallet(walletStr, suspense);

    if (!content || !walletStr || !wallet) {
        return null;
    }

    let name = content.name ?? '';
    let symbol = content.symbol ?? '';
    let description = content.description ?? '';
    let balance = wallet?.balance ?? 0;

    if (content.assets) {
        const asset0Symbol = content.assets[0].type === 'native' ? 'TON' : content.assets[0].metadata.symbol;
        const asset1Symbol = content.assets[1].type === 'native' ? 'TON' : content.assets[1].metadata.symbol;

        const asset0Name = content.assets[0].type === 'native' ? 'TON' : content.assets[0].metadata.name;
        const asset1Name = content.assets[1].type === 'native' ? 'TON' : content.assets[1].metadata.name;

        name = `LP ${asset0Name}-${asset1Name}`;
        symbol = ` ${asset0Symbol}-${asset1Symbol} LP`;

        if (content.pool === 'dedust') {
            description = t('jetton.liquidPoolDescriptionDedust', { name0: asset0Name, name1: asset1Name });
        } else if (content.pool === 'ston-fi') {
            description = t('jetton.liquidPoolDescriptionStonFi', { name0: asset0Name, name1: asset1Name });
        }
    }

    return {
        balance: BigInt(balance),
        wallet: Address.parse(walletStr),
        master: Address.parse(wallet.master),
        name,
        symbol,
        description,
        decimals: content.decimals ?? null,
        icon: content.image?.preview256 ?? null,
        disabled: false,
        assets: !!content.assets ? [content.assets[0], content.assets[1]] : null,
        pool: content.pool,
    };
}