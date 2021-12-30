import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const WalletCreatedFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'stretch' }}>
            <Text style={{ marginHorizontal: 24, fontSize: 24 }}>
                Backup your wallet
            </Text>
            <Text style={{ marginHorizontal: 24, marginTop: 8, fontSize: 18 }}>
                You will be shown a secret recovery phrase on the next screen. The recovery phrase is the only key to your wallet.
                It will allow you to recover access to your wallet if your phone is lost or stolen.
            </Text>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 64, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Back up now" onPress={() => navigation.navigate('WalletBackup')} />
            </View>
        </View>
    );
});