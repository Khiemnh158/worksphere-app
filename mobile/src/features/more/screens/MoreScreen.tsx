import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PlaceholderScreen } from '../../../shared/components/PlaceholderScreen';
import { AppButton } from '../../../shared/components/AppButton';
import type { MainTabNavProp } from '../../../app/navigation/types';

export function MoreScreen() {
  const navigation = useNavigation<MainTabNavProp<'More'>>();

  return (
    <PlaceholderScreen
      title="More"
      screenId="SCR-MAIN-03"
      subtitle="SCR-MAIN-03: More Menu Screen (Phase 12 Shell)"
      testID="screen-more"
    >
      <View style={styles.actionContainer}>
        <AppButton
          title="Hồ sơ cá nhân"
          variant="outline"
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Xem hồ sơ cá nhân"
          testID="btn-navigate-profile"
          style={styles.buttonSpacing}
        />
        <AppButton
          title="Cài đặt ứng dụng"
          variant="outline"
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Xem cài đặt ứng dụng"
          testID="btn-navigate-settings"
        />
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    marginTop: 16,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
});


