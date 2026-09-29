import React, {useEffect, useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ThemeProvider, useTheme, Button, EmptyState, Page, Loading} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {ServicesProvider, useSettings, type Services} from './Services';
import {bootstrap} from '../bootstrap';
import {AppNavigation} from '../navigation';
function Content() {
  const settings = useSettings();
  return (
    <ThemeProvider settings={settings}>
      <NavigationFrame />
    </ThemeProvider>
  );
}
function NavigationFrame() {
  const {colors, dark} = useTheme();
  return (
    <SafeAreaView
      style={[styles.fill, {backgroundColor: colors.background}]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <AppNavigation />
    </SafeAreaView>
  );
}
export function AppShell() {
  const [services, setServices] = useState<Services | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    bootstrap()
      .then(result => {
        if (active) {
          setServices(result);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          {services ? (
            <ServicesProvider services={services}>
              <Content />
            </ServicesProvider>
          ) : (
            <ThemeProvider settings={defaultSettings}>
              <SafeAreaView style={styles.fill}>
                <Page>
                  {failed ? (
                    <EmptyState
                      title="Your library could not be opened"
                      body="Retry without deleting your music. / بدون حذف موسیقی دوباره تلاش کنید."
                      action={
                        <Button
                          label="Try again / تلاش دوباره"
                          onPress={() => setRetry(value => value + 1)}
                        />
                      }
                    />
                  ) : (
                    <Loading label="Opening your library… / در حال باز کردن کتابخانه…" />
                  )}
                </Page>
              </SafeAreaView>
            </ThemeProvider>
          )}
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
class AppErrorBoundary extends React.Component<React.PropsWithChildren, {failed: boolean}> {
  override state = {failed: false};
  static getDerivedStateFromError() {
    return {failed: true};
  }
  override render() {
    return this.state.failed ? (
      <ThemeProvider settings={defaultSettings}>
        <View style={styles.fill}>
          <Page>
            <EmptyState
              title="The app needs to recover"
              body="Restart the app. Your library has not been deleted. / برنامه را دوباره باز کنید."
            />
          </Page>
        </View>
      </ThemeProvider>
    ) : (
      this.props.children
    );
  }
}
const styles = StyleSheet.create({fill: {flex: 1}});
