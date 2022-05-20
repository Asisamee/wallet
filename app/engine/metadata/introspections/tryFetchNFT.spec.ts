import { Address, TonClient4 } from "ton";
import { tryFetchNFT } from "./tryFetchNFT";

const client = new TonClient4({ endpoint: 'https://sandbox-v4.tonhubapi.com' });

describe('tryFetchNFT', () => {
    it('should return NFT data', async () => {
        let fetch = (await tryFetchNFT(client, 89609, Address.parse('kQAIjk144fQ8CThm1lbyfrMo-Nn6i3-pOpe7bI0DiAv0fzaq')))!;
        expect(fetch.inited).toBe(true);
        expect(fetch.index).toBe(19);
        expect(fetch.collection!.toFriendly()).toBe('EQC3mqSMx2vPMDm5cR_8tDl7qZCT-YCO1paCwui-TeLjqwf8');
        expect(fetch.owner!.toFriendly()).toBe('EQDn6IBMKXExC_UjVStHOjCqCW59RADKMGDCfexZByxtCl3T');
    });
});