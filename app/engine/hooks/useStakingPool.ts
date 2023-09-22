import { Address } from '@ton/core';
import { useStakingPoolParams } from './staking/useStakingPoolParams';
import { useSelectedAccount } from './useSelectedAccount';
import { useNetwork } from './useNetwork';
import { useClient4 } from './useClient4';
import { useStakingPoolStatus } from './staking/useStakingPoolStatus';
import { useStakingPoolMember } from './staking/useStakingPoolMember';

export function useStakingPool(address: Address) {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let selected = useSelectedAccount().address;
    let params = useStakingPoolParams(address, client, isTestnet);
    let status = useStakingPoolStatus(address, client, isTestnet);
    let member = useStakingPoolMember(address, selected, client, isTestnet);
    if (!params || !status) {
        return null;
    }

    return {
        params,
        status,
        member,
    };
}