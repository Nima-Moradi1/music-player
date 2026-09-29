import React, {createContext, useContext} from 'react';
import {createStore, type StoreApi} from 'zustand/vanilla';
import {useStore} from 'zustand';
import type {Settings, SettingsRepository} from '../../domain/settings';
import type {TrackRepository} from '../../domain/track';
import type {PlaylistRepository} from '../../domain/playlist';
import type {MediaImporter} from '../../domain/import';
import type {Database} from '../../infrastructure/database/contracts';
import {i18n} from '../../shared/i18n';
type AppState = {settings: Settings; libraryVersion: number; selectedTrackId: string | null};
export type Services = {
  tracks: TrackRepository;
  playlists: PlaylistRepository;
  preferences: SettingsRepository;
  importer: MediaImporter;
  database: Database;
  createId(): Promise<string>;
  selectFiles(): Promise<{uri: string; name: string}[]>;
  state: StoreApi<AppState>;
};
const Context = createContext<Services | null>(null);
export function ServicesProvider({
  services,
  children,
}: React.PropsWithChildren<{services: Services}>) {
  return <Context.Provider value={services}>{children}</Context.Provider>;
}
export function useServices(): Services {
  const value = useContext(Context);
  if (!value) {
    throw new Error('Missing services');
  }
  return value;
}
export function createAppState(settings: Settings) {
  return createStore<AppState>(() => ({settings, libraryVersion: 0, selectedTrackId: null}));
}
export function useSettings() {
  return useStore(useServices().state, state => state.settings);
}
export function useLibraryVersion() {
  return useStore(useServices().state, state => state.libraryVersion);
}
export function useSelectedTrackId() {
  return useStore(useServices().state, state => state.selectedTrackId);
}
export function refreshLibrary(services: Services) {
  services.state.setState(state => ({libraryVersion: state.libraryVersion + 1}));
}
export async function updateSettings(services: Services, changes: Partial<Settings>) {
  const settings = {...services.state.getState().settings, ...changes};
  services.preferences.write(settings);
  services.state.setState({settings});
  await i18n.changeLanguage(settings.locale);
}
