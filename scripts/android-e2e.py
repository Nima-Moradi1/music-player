#!/usr/bin/env python3
"""Native Android acceptance flow. Run only against a disposable emulator."""
import argparse
import json
import re
import shutil
import sqlite3
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlparse


class Device:
    def __init__(self, serial, artifacts):
        self.serial = serial
        self.artifacts = artifacts
        self.adb = shutil.which('adb')
        if not self.adb:
            raise RuntimeError('adb must be on PATH')
        self.steps = []

    def run(self, *args, binary=False):
        result = subprocess.run([self.adb, '-s', self.serial, *args], capture_output=True, check=True)
        return result.stdout if binary else result.stdout.decode().strip()

    def tree(self):
        # A file dump avoids /dev/tty output truncation on newer Android versions.
        for attempt in range(6):
            self.run('shell', 'uiautomator', 'dump', '/sdcard/music-player-ui.xml')
            xml = self.run('exec-out', 'cat', '/sdcard/music-player-ui.xml')
            (self.artifacts / 'last-ui.xml').write_text(xml)
            try:
                root = ET.fromstring(xml)
            except ET.ParseError:
                # UIAutomator can briefly return an empty/partial dump during launch.
                if attempt == 5:
                    raise
                time.sleep(0.5)
                continue
            launcher_anr = any(
                "Launcher isn't responding" in node.get('text', '')
                for node in root.iter('node')
            )
            if launcher_anr:
                wait = self.find(root, 'Wait')
                if wait is not None:
                    print('RECOVER Pixel Launcher ANR dialog', flush=True)
                    self.tap_node(wait)
                    time.sleep(0.5)
                    continue
            return root
        return root

    @staticmethod
    def bounds(node):
        values = [int(x) for x in re.findall(r'\d+', node.get('bounds', ''))]
        return values if len(values) == 4 else [0, 0, 0, 0]

    def find(self, tree, label, prefix=False):
        for node in tree.iter('node'):
            values = (node.get('content-desc', ''), node.get('text', ''))
            match = any(value == label or (prefix and value.startswith(label)) for value in values)
            x1, y1, x2, y2 = self.bounds(node)
            if match and x2 > x1 and y2 > y1:
                return node
        return None

    def wait(self, label, timeout=25, prefix=False):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            node = self.find(self.tree(), label, prefix)
            if node is not None:
                return node
            time.sleep(0.5)
        raise AssertionError(f'Native UI did not show {label!r}; inspect last-ui.xml')

    def tap_node(self, node):
        x1, y1, x2, y2 = self.bounds(node)
        self.run('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))

    def tap(self, label, prefix=False):
        self.tap_node(self.wait(label, prefix=prefix))

    def scroll_to(self, label, horizontal=False, prefix=False):
        for attempt in range(18):
            tree = self.tree()
            node = self.find(tree, label, prefix)
            if node is not None:
                return node
            candidates = [n for n in tree.iter('node') if n.get('scrollable') == 'true']
            if horizontal:
                candidates = [n for n in candidates if 'HorizontalScrollView' in n.get('class', '')]
            else:
                candidates = [n for n in candidates if 'HorizontalScrollView' not in n.get('class', '')]
            if not candidates:
                raise AssertionError(f'No scrollable region reaches {label!r}')
            # Prefer the largest region of the requested orientation.
            node = max(candidates, key=lambda n: (self.bounds(n)[2] - self.bounds(n)[0]) * (self.bounds(n)[3] - self.bounds(n)[1]))
            x1, y1, x2, y2 = self.bounds(node)
            if horizontal:
                coords = (x2 - 25, (y1 + y2) // 2, x1 + 25, (y1 + y2) // 2) if attempt < 6 else (x1 + 25, (y1 + y2) // 2, x2 - 25, (y1 + y2) // 2)
            else:
                coords = ((x1 + x2) // 2, y2 - 60, (x1 + x2) // 2, y1 + 60) if attempt < 6 else ((x1 + x2) // 2, y1 + 60, (x1 + x2) // 2, y2 - 60)
            self.run('shell', 'input', 'swipe', *(str(x) for x in coords), '300')
        raise AssertionError(f'Could not scroll to {label!r}')

    def tap_scrolled(self, label, horizontal=False, prefix=False):
        self.tap_node(self.scroll_to(label, horizontal, prefix))

    def text(self, label, value, replace=False):
        self.tap(label)
        if replace:
            self.run('shell', 'input', 'keyevent', '123', *(['67'] * 80))
        self.run('shell', 'input', 'text', value.replace(' ', '%s'))
        self.run('shell', 'input', 'keyevent', '4')  # Close keyboard, preserving the value.

    def evidence(self, name):
        self.tree()
        shutil.copy(self.artifacts / 'last-ui.xml', self.artifacts / f'{name}.xml')
        (self.artifacts / f'{name}.png').write_bytes(self.run('exec-out', 'screencap', '-p', binary=True))
        if name != 'failure':
            self.steps.append(name)
        print(f'{"CAPTURE" if name == "failure" else "PASS"} {name}', flush=True)


def fixtures(directory):
    if not shutil.which('ffmpeg'):
        raise RuntimeError('ffmpeg is required to synthesize owned codec fixtures')
    directory.mkdir(parents=True, exist_ok=True)
    for extension, codec in [('mp3', 'libmp3lame'), ('flac', 'flac'), ('m4a', 'aac')]:
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-c:a', codec, '-metadata', f'title=Native QA {extension.upper()}', str(directory / f'native-qa.{extension}')], check=True)
    cover = directory / 'cover.jpg'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=1024x1024', '-frames:v', '1', str(cover)], check=True)
    tagged = directory / 'tagged.mp3'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(directory / 'native-qa.mp3'), '-i', str(cover), '-map', '0:a', '-map', '1:v', '-c:a', 'copy', '-c:v', 'mjpeg', '-id3v2_version', '3', '-metadata:s:v', 'title=Album cover', '-metadata:s:v', 'comment=Cover (front)', str(tagged)], check=True)
    tagged.replace(directory / 'native-qa.mp3')
    shutil.copyfile(directory / 'native-qa.mp3', directory / 'native-qa-copy.mp3')
    (directory / 'native-qa-invalid.mp3').write_text('This is not audio.')
    (directory / 'native-qa-empty.mp3').write_bytes(b'')


def import_file(device, filename, expected):
    device.tap_scrolled('Add music')
    # DocumentsUI opens in Recents; choosing Downloads also works after subsequent imports.
    tree = device.tree()
    if device.find(tree, filename) is None:
        for attempt in range(3):
            tree = device.tree()
            if device.find(tree, filename) is not None:
                break
            drawer = device.find(tree, 'Show roots')
            if drawer is not None and device.find(tree, 'Open from') is None:
                device.tap_node(drawer)
            device.tap('Downloads')
            time.sleep(1)
    device.tap(filename)
    device.wait(expected, prefix=True)
    device.evidence(filename.replace('.', '-') + '-result')


def verify_database(device, package, artifacts):
    device.run('shell', 'am', 'force-stop', package)
    files = device.run('shell', 'run-as', package, 'find', '.', '-name', 'library.sqlite').splitlines()
    assert len(files) == 1, f'Expected one native SQLite library, got {files}'
    remote = files[0]
    for suffix in ['', '-wal', '-shm']:
        try:
            (artifacts / ('library.sqlite' + suffix)).write_bytes(device.run('exec-out', 'run-as', package, 'cat', remote + suffix, binary=True))
        except subprocess.CalledProcessError:
            if not suffix:
                raise
    with sqlite3.connect(artifacts / 'library.sqlite') as connection:
        rows = connection.execute('SELECT extension, duration_ms, content_hash, managed_path, artwork_path FROM tracks').fetchall()
        assert sorted(row[0] for row in rows) == ['flac', 'm4a', 'mp3'], rows
        assert all(1500 <= row[1] <= 2500 and len(row[2]) == 64 for row in rows), rows
        assert connection.execute('SELECT count(*) FROM favorites').fetchone()[0] == 1
        assert connection.execute('SELECT count(*) FROM playlists').fetchone()[0] == 0
        assert connection.execute('SELECT count(*) FROM playlist_tracks').fetchone()[0] == 0
        assert connection.execute('SELECT count(*) FROM track_sources').fetchone()[0] == 4
        for row in rows:
            device.run('shell', 'run-as', package, 'test', '-f', unquote(urlparse(row[3]).path))
        media_files = device.run('shell', 'run-as', package, 'find', 'files/media', '-type', 'f').splitlines()
        assert len(media_files) == 4, media_files
        artwork = [row[4] for row in rows if row[4]]
        assert len(artwork) == 1, rows
        thumbnail = artifacts / 'managed-thumbnail.jpg'
        thumbnail.write_bytes(device.run('exec-out', 'run-as', package, 'cat', unquote(urlparse(artwork[0]).path), binary=True))
        dimensions = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', str(thumbnail)]))['streams'][0]
        assert 0 < dimensions['width'] <= 512 and 0 < dimensions['height'] <= 512, dimensions
        assert not any('/temp/' in path for path in media_files), media_files
    device.steps.append('native-sqlite-media-integrity')
    print('PASS native-sqlite-media-integrity', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--serial', required=True)
    parser.add_argument('--apk', type=Path, required=True)
    parser.add_argument('--artifacts', type=Path, default=Path('artifacts/android-e2e'))
    args = parser.parse_args()
    args.artifacts.mkdir(parents=True, exist_ok=True)
    device = Device(args.serial, args.artifacts)
    package = 'com.musicplayer'
    # Never clear or seed a physical/user device. CI and local callers must select explicitly.
    assert args.serial.startswith('emulator-'), 'Only a disposable Android emulator is supported'
    assert device.run('shell', 'getprop', 'ro.kernel.qemu') == '1', 'Refusing to clear a non-emulator'
    try:
        device.run('install', '-r', str(args.apk.resolve()))
        device.run('shell', 'pm', 'clear', package)
        device.run('reverse', 'tcp:8081', 'tcp:8081')
        device.run('logcat', '-c')
        fixture_dir = args.artifacts / 'fixtures'
        fixtures(fixture_dir)
        for path in fixture_dir.iterdir():
            if path.suffix not in {'.mp3', '.m4a', '.flac'}:
                continue
            device.run('push', str(path), '/sdcard/Download/' + path.name)
        device.run('shell', 'am', 'start', '-n', package + '/.MainActivity')
        device.wait('Make it yours', timeout=120)
        # First emulator input can be swallowed while the launcher settles.
        for attempt in range(6):
            tree = device.tree()
            if device.find(tree, 'Library') is not None:
                break
            start = device.find(tree, 'Make it yours')
            if start is not None:
                print(f'ONBOARD tap {attempt + 1}', flush=True)
                device.tap_node(start)
            time.sleep(2)
        device.wait('Library')
        device.evidence('onboarding-tabs')
        device.tap('Discover')
        device.wait('A world of music, thoughtfully connected.')
        device.tap('Downloads')
        device.wait('Your next favorites live here')
        device.tap('Home')
        for extension in ['mp3', 'flac', 'm4a']:
            import_file(device, f'native-qa.{extension}', '1 added · 0 already present · 0 failed')
        import_file(device, 'native-qa-copy.mp3', '0 added · 1 already present · 0 failed')
        import_file(device, 'native-qa-invalid.mp3', '0 added · 0 already present · 1 failed\nChoose a supported MP3, FLAC or M4A/AAC file.')
        import_file(device, 'native-qa-empty.mp3', '0 added · 0 already present · 1 failed\nThis file could not be imported.')
        device.tap('Library')
        device.tap('Add to favorites')
        device.wait('Remove from favorites')
        device.tap_scrolled('Favorites', horizontal=True)
        device.wait('Remove from favorites')
        device.evidence('favorite-filter')
        device.tap_scrolled('Playlists', horizontal=True)
        device.tap('New playlist')
        device.text('Playlist name', 'Native QA Playlist')
        device.tap('Save')
        device.tap('Native QA Playlist · 0')
        device.tap('Rename')
        device.text('Playlist name', 'Native QA Renamed', replace=True)
        device.tap('Save')
        device.wait('Native QA Renamed')
        device.evidence('playlist-created-renamed')
        device.run('shell', 'am', 'force-stop', package)
        device.run('shell', 'am', 'start', '-n', package + '/.MainActivity')
        device.wait('Library')
        device.tap('Library')
        device.wait('Remove from favorites')
        device.tap_scrolled('Playlists', horizontal=True)
        device.tap('Native QA Renamed · 0')
        device.evidence('cold-restart-persistence')
        device.tap('Back')
        # Go through Home to reset the horizontal chip strip and song dimension.
        device.tap('Home')
        device.tap_scrolled('Browse library')
        # The library retains its dimension, so reset to Songs by swiping left-to-right.
        tree = device.tree()
        for _ in range(8):
            songs = device.find(tree, 'Songs')
            if songs is not None:
                device.tap_node(songs)
                break
            strip = next(n for n in tree.iter('node') if 'HorizontalScrollView' in n.get('class', ''))
            x1, y1, x2, y2 = device.bounds(strip)
            device.run('shell', 'input', 'swipe', str(x1 + 25), str((y1 + y2) // 2), str(x2 - 25), str((y1 + y2) // 2), '300')
            tree = device.tree()
        else:
            raise AssertionError('Songs filter was unreachable')
        device.tap('Native QA FLAC, ', prefix=True)
        device.tap_scrolled('Native QA Renamed')
        device.run('shell', 'input', 'keyevent', '4')
        device.tap_scrolled('Playlists', horizontal=True)
        device.tap('Native QA Renamed · 1')
        device.wait('Native QA FLAC, ', prefix=True)
        device.tap_scrolled('Remove from playlist:', prefix=True)
        device.wait('A new home for your songs')
        device.evidence('playlist-membership-added-removed')
        device.tap('Delete')
        device.wait('Delete this playlist?')
        device.tap('Delete')
        device.wait('A new home for your songs')
        device.tap('Home')
        device.tap_scrolled('Settings')
        device.tap('Light')
        device.evidence('light-settings')
        device.tap('Dark')
        device.tap('فارسی')
        device.wait('ظاهر')
        device.evidence('persian-dark-settings')
        device.run('shell', 'input', 'keyevent', '4')
        home = device.wait('خانه')
        downloads = device.wait('دانلودها')
        assert device.bounds(home)[0] > device.bounds(downloads)[0], 'Persian tabs must use RTL ordering'
        device.evidence('persian-rtl-tabs')
        device.tap_scrolled('تنظیمات')
        device.tap('English')
        for label in ['Reduce motion', 'Use solid surfaces', 'High contrast']:
            node = device.scroll_to(label)
            original = node.get('checked', 'false')
            device.tap_node(node)
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                updated = device.wait(label)
                if updated.get('checked', 'false') != original:
                    break
            else:
                raise AssertionError(f'{label} did not expose an updated checked state')
        device.evidence('accessibility-switch-state')
        device.run('shell', 'input', 'keyevent', '4')
        previous = {key: device.run('shell', 'settings', 'get', namespace, key) for namespace, key in [('system', 'font_scale'), ('system', 'accelerometer_rotation'), ('system', 'user_rotation')]}
        try:
            device.run('shell', 'settings', 'put', 'system', 'font_scale', '2.0')
            device.run('shell', 'wm', 'size', '720x1280')
            device.run('shell', 'wm', 'density', '360')
            device.tap('Library')
            device.scroll_to('Search your library')
            device.evidence('large-font-small-screen-library')
            device.run('shell', 'settings', 'put', 'system', 'accelerometer_rotation', '0')
            device.run('shell', 'settings', 'put', 'system', 'user_rotation', '1')
            time.sleep(2)
            for label in ['Home', 'Library', 'Discover', 'Downloads']:
                device.wait(label)
            device.evidence('large-font-landscape-tabs')
        finally:
            device.run('shell', 'wm', 'size', 'reset')
            device.run('shell', 'wm', 'density', 'reset')
            for key, value in previous.items():
                device.run('shell', 'settings', 'put', 'system', key, value)
        verify_database(device, package, args.artifacts)
        (args.artifacts / 'result.json').write_text(json.dumps({'status': 'passed', 'serial': args.serial, 'steps': device.steps}, indent=2) + '\n')
    except Exception as error:
        try:
            device.evidence('failure')
        except Exception:
            pass
        (args.artifacts / 'result.json').write_text(json.dumps({'status': 'failed', 'error': str(error), 'steps': device.steps}, indent=2) + '\n')
        raise
    finally:
        (args.artifacts / 'logcat.txt').write_text(device.run('logcat', '-d'))


if __name__ == '__main__':
    main()
