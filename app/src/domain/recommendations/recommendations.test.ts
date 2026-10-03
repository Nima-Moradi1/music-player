import {fixtureTrack} from '../../testing/fixtures';
import {recommendLocal} from '.';

it('ranks artist and genre ahead of locale, excludes self and unavailable files', () => {
  const anchor = {
    ...fixtureTrack(1),
    artist: 'North',
    genre: 'Jazz',
    album: 'Blue',
    managedPath: 'file:///a',
  };
  const artist = {
    ...fixtureTrack(2),
    artist: 'North',
    genre: 'Pop',
    album: 'Other',
    managedPath: 'file:///b',
  };
  const genre = {
    ...fixtureTrack(5),
    artist: 'Other',
    genre: 'Jazz',
    album: 'Other',
    managedPath: 'file:///c',
  };
  const sameTitle = {
    ...fixtureTrack(3),
    title: anchor.title,
    artist: 'Other',
    genre: 'Pop',
    album: 'Other',
    managedPath: 'file:///d',
  };
  const missing = {...fixtureTrack(4), artist: 'North', managedPath: null};
  expect(recommendLocal(anchor, [anchor, genre, missing, sameTitle, artist], 'fa')).toEqual([
    {track: artist, reason: 'artist'},
    {track: genre, reason: 'genre'},
  ]);
});
