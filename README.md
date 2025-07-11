# DJ Pro - Digital DJ Software

A professional-grade DJ software built with Flask and Web Audio API, featuring automatic BPM detection, playlist management, and multi-deck mixing capabilities.

## Features

- Multi-deck mixing (2-4 decks)
- Automatic BPM detection and beat sync
- Real-time spectrum analysis and waveform display
- Playlist management with folder scanning
- Effects processing (Delay, Reverb, Filter, etc.)
- Volume control and VU meters
- Track library management
- Drag and drop support

## Requirements

- Python 3.8 or higher
- Virtual environment (recommended)
- Web browser with Web Audio API support
- System requirements for audio processing:
  - librosa
  - numpy
  - soundfile
  - mutagen

## Installation

1. Clone the repository:
```bash
git clone https://github.com/batrivieredev/project_test.git
cd project_test
```

2. Run the installation script:
```bash
chmod +x launch.sh
./launch.sh
```

This will:
- Create a virtual environment
- Install dependencies
- Initialize the database
- Create an admin user
- Scan for music in default locations

## Usage

1. Start the application:
```bash
./start.sh
```

2. Login with default credentials:
   - Username: admin
   - Password: admin

3. Access the application at http://localhost:5000

4. Add music:
   - Your music will be automatically scanned from:
     - ~/Music
     - ~/Downloads
     - ./uploads
   - Or drag and drop files into the library panel

5. Use the interface:
   - Click tracks to load them into decks
   - Use the play/pause buttons to control playback
   - Adjust volume with vertical faders
   - Monitor levels with VU meters
   - Apply effects using the FX panel
   - View waveforms and spectrum analysis in real-time

## Commands

- `./launch.sh` - First-time setup and installation
- `./start.sh` - Normal startup with environment checks
- `./restart.sh` - Restart application without clearing database
- `./verify_components.sh` - Run system verification
- `python test_system.py` - Run test suite

## Development

1. Install development dependencies:
```bash
pip install -r requirements.txt
```

2. Run tests:
```bash
python test_system.py
```

3. Format code:
```bash
black .
flake8
```

## Troubleshooting

1. If music files aren't being detected:
   - Check file permissions
   - Verify supported formats (mp3, wav, aiff, ogg, m4a)
   - Run `./verify_components.sh` to check system setup

2. If BPM detection isn't working:
   - Ensure librosa is properly installed
   - Check if the audio file is corrupted
   - Try re-encoding the file

3. If the application won't start:
   - Check port 5000 is available
   - Verify database permissions
   - Look for errors in the console output

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
